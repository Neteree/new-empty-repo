<script lang="ts">
  // Public contact details (phone, map address, Instagram, Facebook): the
  // same questions for a new website and for a change to one.
  let {
    id,
    phone = $bindable(''),
    address = $bindable(''),
    instagram = $bindable(''),
    facebook = $bindable(''),
  }: { id: string; phone?: string; address?: string; instagram?: string; facebook?: string } = $props();
</script>

<div class="field"><label for="{id}-address">Street address for a map link</label><input id="{id}-address" placeholder="12 Main Road, Green Bay, Auckland" bind:value={address} /></div>
<div class="field"><label for="{id}-phone">Phone number for customers</label><p class="hint" id="{id}-phone-hint">Shown on your site so people can tap to call.</p><input id="{id}-phone" type="tel" bind:value={phone} aria-describedby="{id}-phone-hint" /></div>
<div class="row">
  <div class="field"><label for="{id}-instagram">Instagram</label><input id="{id}-instagram" placeholder="@yourbusiness" bind:value={instagram} /></div>
  <div class="field"><label for="{id}-facebook">Facebook page</label><input id="{id}-facebook" placeholder="facebook.com/yourbusiness" bind:value={facebook} /></div>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
  }
  .field {
    display: grid;
    gap: 0.35rem;
  }
  label {
    font-weight: 700;
  }
  .hint {
    margin: 0;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  input {
    width: 100%;
    border: 2px solid var(--ink);
    border-radius: 0.5rem;
    background: var(--paper);
    padding: 0.6rem 0.75rem;
  }
</style>
