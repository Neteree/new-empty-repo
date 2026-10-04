<script lang="ts">
  // Opening hours, or none at all (for people who don't open at set times):
  // the same question for a new website and for a change to one.
  import HoursPicker from '../../components/forms/HoursPicker.svelte';

  let {
    id,
    hours = $bindable([]),
    none = $bindable(false),
    invalid = false,
  }: { id: string; hours?: { days: string; times: string }[]; none?: boolean; invalid?: boolean } = $props();
</script>

<div class="field">
  <span class="label" id="{id}-label">Opening hours (tick every day you’re open)</span>
  <label class="tick"><input type="checkbox" bind:checked={none} /> No opening hours (people don’t visit at set times)</label>
  {#if !none}<HoursPicker {id} bind:hours {invalid} />{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 0.35rem;
  }
  .label {
    font-weight: 700;
  }
  .tick {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
</style>
