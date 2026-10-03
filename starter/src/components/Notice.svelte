<script lang="ts">
  // A notice across the top of every page (site.json "notice"), e.g. holiday
  // closures. The page shell leaves it out once its end date has passed when
  // the site is built; a one-line script also hides it on the day after, in
  // case the site isn't rebuilt by then.
  let { text, until }: { text: string; until: string } = $props();
</script>

<p class="notice" data-until={until || undefined}>{text}</p>

<style>
  .notice {
    margin: 0;
    padding: 0.6rem clamp(1rem, 4vw, 2.5rem);
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
    text-align: center;
  }
</style>
