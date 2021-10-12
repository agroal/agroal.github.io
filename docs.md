---
layout: docs
---

Agroal library allows the definition of `java.sql.DataSource` with connection pooling.
This guide goes over what does Agroal provide and the configurations available in the library.

## The `AgroalDatasource` class

Agroal provides a specific implementation of `java.sql.DataSource` that extends it with important functionally.
The added methods are the following:

  * `getConfiguration()` - Allows retrieving the current datasource configuration and modify the read-write attributes.
  * `getMetrics()` - Allows retrieving metrics and statistics from the connection pool. The datasource has to have metrics enabled in order for those to be collected. Please refer to the metrics section for details on what is collected.
  * `close()` - `AgroalDataSource` implements the `java.lang.AutoClosable` interface so that it can be used in try-with-resources constructs.
  * `isHealthy(boolean)` Since 1.13 this method checks the health of the data source by performing validation on one of the connections or the pool, or by establishing a new connection. In the latter case, the number of connections on the pool can go over max-size.
  * `flush()` - Allows removal of connections from the pool. There are several modes for this operation, that determine what and when connections are removed from the pool. These are:
    * `ALL` - Causes all connections to be flushed immediately. Connections handed to applications are immediately closed.
    * `GRACEFUL` - Connections on the pool are flushed immediately and connections handed to applications are flushed as soon as they are returned to the pool.
    * `IDLE` - Connections not in use are flushed immediately. Connections in use are not flushed.
    * `INVALID` - Performs on-demand validation of idle connections on the pool. If a connection is in use it's assumed to be valid. If a connection is determined to be invalid, it's flushed.
    * `FILL` - Creates connections to fulfill the minimum size of the pool. After other flush operations, the number of connections of the pool can drop below the minimum size and this operation allows the pool to grow back right away.

### Metrics

This a list of all the metrics exposed by `AgroalDataSource`. Agroal does not collect metrics by default due to the impact it has on runtime performance, but it can be enabled at any time.

  * `creationCount()` - Number of created connections.
  * `creationTimeAverage()` `creationTimeMax()` `creationTimeTotal()` - Statistics of connection creation duration.
  * `leakDetectionCount()`- Number of times a leak was detected. A single connection can be detected multiple times.
  * `invalidCount()` - Number of connections removed from the pool for being invalid.
  * `flushCount()` - Number of connections removed from the pool, not counting invalid / idle.
  * `reapCount()` - Number of connections removed from the pool for being idle.
  * `destroyCount()` - Number of destroyed connections.
  * `activeCount()` - Number active of connections. These connections are in use and not available to be acquired.
  * `maxUsedCount()` - Maximum number of connections active simultaneously.
  * `availableCount()` - Number of idle connections in the pool, available to be acquired.
  * `acquireCount()` - Number of times an acquire operation succeeded.
  * `blockingTimeAverage()` `blockingTimeMax()` `blockingTimeAverage()` - Statistics for duration of blocked threads waiting for a connection.
  * `awaitingCount()` - Approximate number of threads blocked, waiting to acquire a connection.

### AgroalDataSourceListener

When creating an AgroalDataSource there can be specified listeners with callbacks that are invoked for most interesting moments of the connection life-cycle, as well as important events for the pool. Agroal does not do any logging by default, so any message it wants to communicate it does so using this interface. Events like leak detection are also notified on this interface. The tests for Agroal also rely heavily on this interface for understanding the operation of the pool. Keep in mind that these methods are supposed to be fast to execute and not block, as are called either from the thread acquiring a connection or Agroal own internal thread.

### AgroalPoolInterceptor

Since 1.8 Agroal provides another mechanism to notify about pool events. While the listener is more geared towards integrators of Agroal, the interceptor is safe for higher level applications to use. Not only it's safe to execute operations on the connection, these are performed in the transaction and have safeguards for failures.

### Spring Boot starter

Since 1.9 Agroal can be easily chosen as the connection pool in Spring Boot projects. For that, just add `agroal-spring-boot-starter` as a dependency to your project and configure it with `spring.datasource.agroal.*` keys.

## Configuration

The configuration for an Agroal datasource is split in three levels. There is a main set of high-level properties, the configuration for the connection pool and the configuration for the connection factory.
Below is an exhaustive list of the available settings, split into three levels.

### DataSourceConfiguration

  * `dataSourceImplementation(DataSourceImplementation)` - Actual AgroalDataSource implementation. This allows flexibility to have different implementations of the Agroal API.
  There are two implementations, `AGROAL` is the default but there is also `HIKARI` which wraps the popular connection pool (it's used for testing purposes, as the Agroal API is not fully supported).
  Starting with 1.6 there is also `AGROAL_POOLLESS` specialized for the use case where connections are pooled outside Agroal. It can be seen as a pool where the min-size is zero and connections are flushed immediately on close.  

  * `metricsEnabled(boolean)` - Whether to collect metrics. Metrics are not collect by default. This setting can be modified during runtime.

  * `connectionPoolConfiguration(AgroalConnectionPoolConfiguration)` - The configuration of the connection pool.

### ConnectionPoolConfiguration

  * `transactionIntegration(TransactionIntegration)` - Specifies the integration point with transaction systems. This integration can change how and when connections move in and out of the pool. See the chapter on transactions for more information.
           
  * `connectionCache(ConnectionCache)` - This setting was added in 1.12 and allows a custom strategy for a local connection cache. Some basic implementations are provided by Agroal and the default is `single`.

  * `flushOnClose(boolean)` - This setting was added in 1.6 and allows for connections to be flushed upon return to the pool. It's not enabled by default.  

  * `initialSize(int)` - The number of connections added to the pool when it is started. The default is zero and must not be negative. It's not required that is a value between min and max sizes.

  * `minSize(int)` - The minimum number of connections present on the pool. The default is zero and must not be negative. Also, it has to be smaller than max.
  This value can be changed during runtime, meaning the actual number of connection in the pool may be smaller than the minimum for some periods of time. In those circumstances Agroal chooses to create new connections instead of handing the ones already pooled.

  * `maxSize(int)` - The maximum number of connections present on the pool. This is a required value that must not be negative.
  This value can be changed during runtime, meaning the actual number of connections on the pool can be greater than the maximum for some periods of time. In those circumstances Agroal does flush connections as soon as they are returned to the pool.  

  * `connectionValidator(ConnectionValidator)` - The method to use for connection validation. This allows for customization of the validation process. By default, connections are always considered as valid.

  * `exceptionSorter(ExceptionSorter)` - This extension point tells Agroal which exceptions indicate that the connection is in an invalid state and should be removed from the pool. Agroal provides a few implementations of the `ExceptionSorter` interface for selected databases. By default, no exception is considered fatal.

  * `acquisitionTimeout(Duration)` - The maximum amount of time a thread can wait for a connection, after which an exception is thrown instead. The default is zero, meaning a thread will wait indefinitely. This property can be changed during runtime.

  * `idleValidationTimeout(Duration)` - A foreground validation is executed if a connection has been idle on the pool for longer than this duration. The default is zero, meaning that foreground validation is not performed.

  * `leakTimeout(Duration)` - The duration of time a connection can be held without causing a leak to be reported. The default is zero, meaning that Agroal does not check for connection leaks.

  * `validationTimeout(Duration)` - The interval between background validation checks. The default is zero, meaning background validation is not performed.

  * `reapTimeout(Duration)` - The duration for eviction of idle connections. The default is zero, meaning connections are never considered to be idle.

  * `maxLifetime(Duration)` - The maximum amount of time a connection can live, after which it is removed from the pool. The default is zero, meaning this feature is disabled.

  * `enhancedLeakReport(boolean)` - Provides detailed insights of the connection status when it's reported as a leak (as INFO messages on AgroalDataSourceListener). Added on 1.10 and not enabled by default.

  * `multipleAcquisition(MultipleAcquisitionAction)` - Behaviour when a thread tries to acquire multiple connections. Default is to allow, can also warn or throw exception. This setting was added on 1.10.

  * `transactionRequirement(TransactionRequirement)` - Requirement for enlisting connection with running transaction. The default is to not require enlistment, can also warn or throw exception. This setting was added on 1.10.    

  * `connectionFactoryConfiguration(AgroalConnectionFactoryConfiguration)` - The configuration of the connection factory, used to create new connections.

### ConnectionFactoryConfiguration

  * `autoCommit(boolean)` - The value of the auto-commit property on the connection. Default is true.

  * `trackJdbcResources(boolean)` - Since 1.6 this setting allows for disabling the tracking of JDBC resources (`Statement` and `ResultSet`) which is enabled by default. These resources are tracked so that they are closed when the connection returns to the pool, thus preventing any leaks.

  * `jdbcUrl(String)` - The database URL to connect to. The default is the empty string.

  * `initialSql(String)` - A SQL command to be executed when a connection is created. The default is the empty string, meaning that nothing is executed.

  * `connectionProviderClass(Class<?>)` - The class from the JDBC driver to be used as a supplier of connections. The default is null, so that the driver will be obtained from the URL (using the `java.sql.DriverManager#getDriver(String)` mechanism).

  * `connectionProviderClassName(String)` - Alternative way to load a JDBC driver class by using its fully qualified name. This method throws Exception if the class can't be loaded.

  * `jdbcTransactionIsolation(TransactionIsolation)` - The transaction isolation level. Default is `UNDEFINED`, meaning that the default isolation level for the JDBC driver is used.

  * `jdbcTransactionIsolation(int)` - Since 1.5 Agroal also supports custom transaction isolation levels.

  * `addSecurityProvider(AgroalSecurityProvider)` - The extension point for custom authentication mechanisms was added in version 1.5 to deal with custom principal/credential types. The default is to have `AgroalDefaultSecurityProvider` and `AgroalKerberosSecurityProvider`. See the chapter on security for more information.

  * `principal(Principal)` - The principal to be authenticated in the database. Default is to don't perform authentication.

  * `credential(Object)` - Sets credentials to use in order to authenticate to the database. Multiple credentials can be provided. Default is to don't provide any credentials.

  * `recoveryPrincipal(Principal)` - Allows setting a different principal for recovery connections. Since version 1.2.

  * `recoveryCredential(Object)` - Allows setting different credentials for recovery connections. Since version 1.2.

  * `jdbcProperty(String, String)` - Allows setting other properties to be passed to the JDBC driver when creating new connections. NOTE: username and password properties are not allowed, these have to be set using the principal / credentials mechanism.
