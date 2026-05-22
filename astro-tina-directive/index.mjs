/**
 * Astro integration that registers the `client:tina` directive.
 * Add this to your astro.config.mjs integrations array.
 */
export default function tinaDirective() {
  return {
    name: 'tina-directive',
    hooks: {
      'astro:config:setup': ({ addClientDirective }) => {
        addClientDirective({
          name: 'tina',
          entrypoint: './astro-tina-directive/client-tina.mjs',
        });
      },
    },
  };
}
