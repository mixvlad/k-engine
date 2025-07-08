// Helper to generate HTML block with social icons and subscriber counts
function generateSocialIconsHtml(subs) {
    return `<script src="https://apis.google.com/js/platform.js"></script>
<div class="social-icons">
    <div class="g-ytsubscribe" data-channelid="UCBFYIbjqFFhFZBvE1JmvpEg" data-layout="default" data-count="default"></div>
    <a href="https://www.tiktok.com/@koz.tv" title="TikTok"><i class="fab fa-tiktok"></i>${subs.TikTok ? `<span class='sub-count'>${subs.TikTok}</span>` : ''}</a>
    <a href="https://www.instagram.com/koz.tv/" title="Instagram"><i class="fab fa-instagram"></i>${subs.Instagram ? `<span class='sub-count'>${subs.Instagram}</span>` : ''}</a>
    <a href="https://t.me/koztv" title="Telegram"><i class="fab fa-telegram"></i>${subs.Telegram ? `<span class='sub-count'>${subs.Telegram}</span>` : ''}</a>
    <a href="https://x.com/x_koz_tv" title="X (Twitter)"><i class="fab fa-twitter"></i>${subs.X ? `<span class='sub-count'>${subs.X}</span>` : ''}</a>
    <a href="https://www.reddit.com/user/koz-tv/" title="Reddit"><i class="fab fa-reddit"></i>${subs.Reddit ? `<span class='sub-count'>${subs.Reddit}</span>` : ''}</a>
    <a href="https://www.threads.com/@koz.tv" title="Threads"><i class="fas fa-at"></i>${subs.Threads ? `<span class='sub-count'>${subs.Threads}</span>` : ''}</a>
    <a href="https://koztv.itch.io/" title="itch.io"><i class="fab fa-itch-io"></i>${subs["itch.io"] ? `<span class='sub-count'>${subs["itch.io"]}</span>` : ''}</a>
    <a href="https://mastodon.gamedev.place/@koz_tv" title="Mastodon"><i class="fab fa-mastodon"></i>${subs.Mastodon ? `<span class='sub-count'>${subs.Mastodon}</span>` : ''}</a>
    <a href="https://bsky.app/profile/koz.tv" title="Bluesky"><i class="fas fa-cloud"></i>${subs.Bluesky ? `<span class='sub-count'>${subs.Bluesky}</span>` : ''}</a>
  </div>`;
}

export { generateSocialIconsHtml }; 