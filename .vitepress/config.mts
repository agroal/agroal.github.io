import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
   title: "AGROAL",
   description: "Documentation website for Agroal",
   themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
         { text: "News", link: "/news" },
         { text: "Releases", link: "/releases" },
         { text: "Docs", link: "/docs.md" },
         { text: "About", link: "/about.md" },
      ],

      footer: {
         message:
            "<span class='vp-doc'></span>",
         copyright:
            "© 2017/2024 <a href='https://www.redhat.com/en'>RedHat Inc</a>.",
      },

      sidebar: [
         {
            text: "Home",
            link: "/"
         },
         {
            text: "GitHub",
            link: "https://github.com/agroal",
         },
         {
            text: "License",
            link: "https://www.apache.org/licenses/LICENSE-2.0",
         },
         {
            text: "Issues",
            link: "https://issues.redhat.com/projects/AG/issues",
         },
      ],

      socialLinks: [{ icon: "github", link: "https://github.com/agroal" }],
   },
});
