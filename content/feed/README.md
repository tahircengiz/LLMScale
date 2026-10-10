# News feed posts

Each `*.json` file here is a **published** post: the build (`scripts/genFeed.ts`)
turns every one of them into the feed pages, `feed.xml` and a page per post, in
English and Turkish. While this folder has no posts, the build writes no feed
pages and nothing links to them.

Posts are drafted and reviewed outside this repository; a file lands here only
once it has been approved. The format, and every rule a post must pass, is
`validatePost()` in [`src/lib/feed.ts`](../../src/lib/feed.ts). An image a post
carries goes in `media/` next to the posts.

Sample posts for previews live in `scripts/fixtures/feed/`. To build the site
with them instead of the real ones:

```bash
FEED_DIR=scripts/fixtures/feed npm run build
```
