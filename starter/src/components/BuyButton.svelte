<script lang="ts">
  // "Buy" to an item's Stripe payment link (a shop product or a price list
  // item). `small` fits it on a line of a list.
  let { href, name, small = false }: { href: string; name: string; small?: boolean } = $props();
</script>

<a class="button" class:small {href} rel="noopener">Buy<span class="visually-hidden"> {name}</span></a>

<style>
  .small {
    padding: 0.3rem 0.8rem;
    font-size: 0.9rem;
  }
</style>
