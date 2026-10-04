<script lang="ts">
  import SectionHead from './SectionHead.svelte';
  // News posts on the home page, newest first. Shown once there's a post.
  let { name, posts }: { name: string; posts: { href: string; date: string; title: string; excerpt: string }[] } = $props();
</script>

{#if posts.length}
  <section id="journal" class="section">
    <SectionHead note="News" title={`Latest from ${name}`} />
    <div class="posts">
      {#each posts as post (post.href)}
        <a class="post-card" href={post.href}>
          <p class="post-date">{post.date}</p>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .posts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    gap: 2rem;
  }

  .post-card {
    display: block;
    text-decoration: none;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    padding: 1.5rem;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .post-card:hover {
    transform: translate(-3px, -3px);
    box-shadow: 6px 6px 0 var(--highlight);
  }

  .post-date {
    margin: 0 0 0.3rem;
    font-weight: 700;
    color: var(--accent);
  }

  h3 {
    font-size: 1.6rem;
    margin-bottom: 0.5rem;
  }

  .post-card p:last-child {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
