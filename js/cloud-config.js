/* 雲端同步（Supabase）專案設定。設定步驟見 docs/雲端同步設定.md。
 * url：Project URL（https://xxxx.supabase.co）；key：anon／publishable key（公開金鑰，可以放進程式碼，資料由資料表的 RLS 保護）。
 * 兩個都留空時，可以在遊戲「設定與存檔 → 雲端同步」裡直接貼上（只存在那台瀏覽器）。
 * 絕對不要放 service_role／secret key。 */
window.CLOUD_CFG = {
  // file:// 的圖片若受瀏覽器畫布限制，從同一份公開網站讀取；HTTP(S) 一律用目前頁面的圖片。
  assets: 'https://yc0935019269cloud-create.github.io/xuece-quiz-framework-test-1/',
  url: 'https://fsfjvflfmpoohgfdzfpm.supabase.co',
  key: 'sb_publishable_fvEvvLuZy_sQYozPN5IH0Q_e0pFps57',
};
