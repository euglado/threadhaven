# ThreadHaven

**Türkçe:** Topluluk yöneticileri için önizlemeli Discord tartışma başlıkları.
**English:** Preview and confirm public Discord discussion threads for community organizers.

Bir GitHub deposu botu kendiliğinden çalıştırmaz. Kendi Discord uygulamanız, gizli bot tokenınız ve sürekli açık Node.js 24 süreciniz gerekir. / Publishing this repository does not host the bot. Bring your own Discord application, secret bot token and continuously running Node.js 24 process.

## Türkçe

### Amaç ve özellikler

Kitap kulübü, etkinlik değerlendirmesi veya topluluk çalışma grubu için normal bir metin kanalından `/threadhaven` çalıştırın. Başlığı, görünürlüğü ve sabit ayarları **yalnızca sizin görebildiğiniz** önizlemede kontrol edin. **Herkese açık başlık oluştur** düğmesine basıldığında bot bir public thread oluşturur ve özel yanıtta tıklanabilir bağlantı verir. **Vazgeç** hiçbir şey oluşturmaz.

- Sunucuyu Yönet yetkisi bulunan organizatörlerle sınırlıdır; oluşturma öncesinde izinler tekrar alınır.
- 3–80 karakterlik başlık; Unicode harf/rakam ve sade noktalama. Kenar boşlukları kırpılır, ardışık normal boşluklar birleştirilir; aksanlar NFC biçimine getirilir. Bağlantı, etiket, emoji, satır sonu, Markdown ve gizli yönlendirme karakterleri kabul edilmez. Benzer görünen Unicode harfleri ayırt etmez; başlığı insan kontrol etmelidir.
- Sabit **60 dakika hareketsizlik** ve **5 saniye yavaş mod** ayarı. Bunlar önizlemede görünür.
- Başlangıç mesajı yazmaz; üyeleri eklemez/davet etmez. Bot başlığın teknik oluşturucusudur. Organizatör bağlantıyı açıp Discord'un Katıl düğmesini kullanabilir; tartışmayı kendisi başlatır.
- Önizleme Türkçe/İngilizce; hatalar iki dilli. `language` verilmezse Türkçe Discord dili için Türkçe, diğer diller için İngilizce seçilir.

**Sınırlar:** Bu bot private thread, forum/medya gönderisi veya duyuru başlığı oluşturmaz. Mesaj okumaz, moderasyon yapmaz, içerik taramaz, otomatik mesaj/davet/hatırlatma göndermez, başlıkları silmez/düzenlemez veya üye listesi tutmaz. Başlangıçta konu dışına taşmayı kendiliğinden önleyemez. Discord'un yerleşik başlık oluşturucusu da kullanılabilir; bu bot sunucu yöneticileri için ortak önizleme, görünürlük uyarısı ve sabit ayarlar sağlar.

**Herkese açık** burada ana kanalı görebilen herkese açık demektir; tüm internete açık anlamına gelmez. Ana kanalın izinleri belirleyicidir. Bu akış gizli destek talebi için uygun değildir. Arşivleme silme değildir: Discord 60 dakikalık hareketsizlik sonrasında başlığı kanal listesinden kaldırabilir; yeni etkinlik süreyi uzatabilir ve arşivlenmiş başlık yeniden açılabilir. Yavaş moddan muaf üyeler bu sınıra tabi olmayabilir. Bot bir saatlik kapanış veya silme garantisi vermez.

### Gereksinimler

Windows, macOS veya Linux; [Node.js 24 LTS](https://nodejs.org/) ve onunla gelen npm; internet erişimi; Discord sunucusunda uygulama davet edebilme ve Sunucuyu Yönet izni. `node --version` çıktısı `v24.` ile başlamalıdır. Kod düzenlemek, veritabanı açmak veya ayrı web sunucusu kurmak gerekmez. Tek yapılandırma tek sunucuyu destekler; aynı uygulama için yalnızca **bir bot süreci** çalıştırın. Birden fazla süreç tekrar oluşturmayı engelleyen RAM durumunu paylaşmaz.

### Developer Portal ve davet

1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**. Açıkça tanıdığınız bir ad verin.
2. **General Information** → **Application ID** değerini alın. Bu gizli bir token değildir.
3. **Bot** → gerekirse botu oluşturun, **Reset Token** ile kendi bot tokenınızı alın. Token paroladır; ekran görüntüsüne, GitHub'a, sohbetlere veya CI secrets'a koymayın. Bu proje CI'de token kullanmaz. Sızarsa Portal'dan hemen yenileyin ve yerel yapılandırmayı değiştirin.
4. **Privileged Gateway Intents** altındaki Presence, Server Members ve Message Content seçeneklerini **kapalı** tutun. Bot yalnızca ayrıcalıklı olmayan `Guilds` intentini kullanır.
5. **Installation** bölümünde **Guild Install** kullanın; kişisel kurulum bu botun akışı değildir. OAuth2 kapsamları `bot` ve `applications.commands`. Gerekli bot izinleri yalnızca **View Channel / Kanalı Görüntüle** ve **Create Public Threads / Herkese Açık Alt Başlık Oluştur**. **Administrator / Yönetici eklemeyin.** İzin sayısı `34359739392`.
6. **Interactions Endpoint URL** alanını boş bırakın: bot etkileşimleri sürekli açık Gateway bağlantısından alır. Kendi sunucunuz için istiyorsanız Public Bot seçeneğini kapatabilirsiniz.
7. Discord → Kullanıcı Ayarları → Gelişmiş → **Geliştirici Modu**. Sunucu simgesine sağ tıklayıp **Sunucu Kimliğini Kopyala**. Kanal kimliği yerine sunucu kimliğini kullanın.
8. Aşağıdaki setup akışı Application ID, Server ID ve gizli token ister; ardından bu sunucuya sabitlenmiş tıklanabilir davet bağlantısı gösterir. Bağlantıyı açın, sunucuyu kontrol edin, izinleri inceleyip uygulamayı davet edin.

### Kurulum ve yapılandırma

[Depoyu](https://github.com/euglado/threadhaven) **Code → Download ZIP** ile indirin, ZIP'i tamamen çıkarın. İçinde `package.json` olan klasörü kullanın. Token içeren `.env` dosyasını ortak/buluta yedeklenen klasöre koymayın. İndirilen kodu çalıştırmadan inceleyin.

**Windows:** Node.js kurduktan sonra `setup.cmd` dosyasını çift tıklayın. Üç soruyu yanıtlayın; token yazılırken karakter görünmez. Gösterilen davet bağlantısını açın. Sonra `register.cmd`, ardından `start.cmd` dosyasını açın. Başlatma penceresini açık tutun. Windows dosya adlarını gizliyorsa yanlışlıkla `.env.txt` oluşturmayın; yardımcı bunu sizin için yapar.

**macOS/Linux:** Terminal'i proje klasöründe açın. Sırasıyla çalıştırın:

```bash
bash setup.sh
# Soruları yanıtlayın ve gösterilen davet bağlantısını açın.
bash register.sh
bash start.sh
```

**Tüm platformlarda terminal alternatifi:**

```text
node --version
npm ci --ignore-scripts
npm run setup
npm run register
npm start
```

`setup` gerçek etkileşimli terminal ister; yönlendirilmiş girdi veya CI için tasarlanmamıştır. Tokenı ekrana yazmaz ve `.env` dosyasını **üzerine yazmadan** oluşturur. Unix'te yeni dosya modu 0600'dır; Windows'ta dosya erişimi klasör/hesap izinlerine bağlıdır. Tokenı güvenli parola yöneticisinde saklayın. Yeniden kurulumda botu durdurun, `.env` dosyasını güvenli konumda yeniden adlandırın, setup/register/start adımlarını tekrarlayın, eski token dosyasını güvenle kaldırın. Yedek dosyayı deponun içine koymayın.

Oluşan ayarlar: `DISCORD_TOKEN` (gizli bot tokenı), `APPLICATION_ID` (uygulama kimliği), `GUILD_ID` (izin verilen sunucu kimliği). `.env.example` yalnızca anahtar adlarını gösterir. Kaynak kod düzenlenmez. `.env` ve `.env.*` Git'ten dışlanır. Otomatik çalışan CI'a gerçek token eklemeyin. `npm run register` yalnızca bu sunucudaki `/threadhaven` komutunu oluşturur/günceller; uygulamanın başka komutlarını topluca silmez.

### Kullanım ve izinler

Normal, yaş kısıtlaması olmayan ve **ana kanal yavaş modu kapalı** bir metin kanalında şunu seçin:

```text
/threadhaven title: Kitap kulübü Ekim değerlendirmesi language: tr
```

Önizlemeyi okuyun → oluştur veya vazgeç → oluşan özel bağlantıyı açın. Başlık listesinden de erişebilirsiniz. Önizleme beş dakikada geçersizleşir, tek kullanımlıktır ve kullanıcı/sunucu/kanal/özel mesaj kimliğine bağlıdır. Yeniden başlatma bekleyen önizlemeleri siler; oluşturulan başlıklar kalır. Düğme süresi dolarsa yeni komut açın.

Organizatörde **Manage Server**, **View Channel**, **Create Public Threads**, **Send Messages in Threads** ve Discord'un komutu göstermek için istediği **Use Application Commands** bulunmalı. Botta yalnızca **View Channel** ve **Create Public Threads** gerekir. Bot başlıklara mesaj göndermediğinden **Send Messages**, **Send Messages in Threads**, **Read Message History**, **Manage Threads**, **Manage Channels**, **Manage Roles** veya **Administrator** istemez. Yanıtlar Discord etkileşim yanıtlarıdır. Botta herhangi bir rolden Administrator varsa akış durur. Sunucu sahibi/yönetici insanlar Discord'un normal izin istisnalarını korur.

Bot önizlemede ve onay anında sunucu, roller, kanal izinleri, organizatör ve kendi üyelik verilerini resmi REST uçlarından tekrar alır; önbellekteki izin kararını kullanmaz. Katılım taraması bekleniyorsa veya üye/bot timeout altındaysa durur. Kanal adı değişirse yeni önizleme gerekir. Discord API çağrıları tek işlem değildir: aynı anda bir yönetici izinleri değiştirirse kontrol ve oluşturma arasında yarış kalabilir. Discord kendi bot izinlerini de uygular; insan organizatörün yetkisinin eşzamanlı kaldırılması tamamen atomik biçimde garanti edilemez.

Bir kullanıcı için önizleme aralığı 5 saniye; kanal başına oluşturma girişimi aralığı 60 saniye; işlem sürerken ek kilit. En fazla 100 önizleme, her kapı için 100 eşzamanlı işlem ve 1000 kısa süreli cooldown kaydı. Dolulukta yeni işlem reddedilir. Başlık sayısını veya aynı adlı eski başlıkları taramaz; farklı bir önizleme aynı adla yeni başlık oluşturabilir. Ağ/REST hatasında otomatik oluşturma tekrarı yapılmaz; hata mesajı başlığın oluşmuş olabileceğini söylüyorsa **yeniden denemeden önce kanalın başlık listesini kontrol edin**.

### Botu çalışır tutma

`start` penceresi kapanırsa, bilgisayar uyursa veya ağ kesilirse komutlar yanıt vermez. Sürekli kullanım için size ait, Node 24 destekleyen bir bilgisayar veya hosting hesabında tek süreci açık tutun. Hosting panelinde kurulum komutu `npm ci --ignore-scripts`, başlangıç `npm start`, Node sürümü 24; üç ayarı panelin gizli ortam değişkenlerine girin. Kodunuzun sürümüyle uyumlu Node 24 kullanın. Kendi terminalinizde bir kez register çalıştırın; bunu her yeniden başlamada otomatik tekrarlamayın. Gerekiyorsa panelin tek süreçli yeniden başlatma özelliğini kullanın. Bu repo hosting sağlayıcısı seçmez veya sunucunuzu yapılandırmaz; ücretsiz hosting uyuyabilir. Sağlayıcının gizlilik/günlük politikasını siz değerlendirin.

Güncellemeden önce botu durdurun, `.env` dosyasını güvenle koruyun, yeni sürümün notlarını inceleyin, kaynağı güncelleyin, `npm ci --ignore-scripts` ve kontrolleri çalıştırın; register ardından start. `Ctrl+C` ile durdurun. Kaldırmak için süreci durdurup Discord'dan uygulamayı çıkarın; kalan başlıkları yetkili insan Discord üzerinden yönetir.

### Güvenlik ve gizlilik

Veritabanı, dosyaya taslak yazma, analitik veya başka hizmete aktarım yoktur. RAM'de başlık, ana kanal adı, dil ve kullanıcı/sunucu/kanal/özel önizleme mesajı kimlikleri beş dakikalık onay için tutulur. Geçersiz taslaklar erişimde silinir; boşta kalanlar 30 saniyelik temizlikle en geç yaklaşık beş dakika otuz saniyede kaldırılır. Kullanılmış/iptal edilmiş taslak hemen kaldırılır. Cooldown kimlikleri 5/60 saniye artı en fazla 30 saniyelik temizlik gecikmesi boyunca tutulabilir; devam eden işlem bitene kadar kilit kalır. Gateway kitaplığı sunucu/rol/kanal metaverisini çalışma belleğinde tutabilir; mesaj önbelleği ve üye önbelleği kapalıdır. Tekil üye/rol verileri izin kontrolü için alınır, toplu üye listesi çekilmez. Kendi `.env` dosyanız diskte gizli kalır.

Bot günlükleri başlık, kimlik, token veya ham API hatası basmaz. Discord başlıkları, etkileşimler ve denetim kayıtları kendi politikasına göre kalabilir; arşivleme bunları silmez. Önizleme Discord'da yalnızca size görünür; Discord ve cihaz/hosting yöneticisinden gizli değildir. Başlıklara kişisel veya gizli bilgi girmeyin. Varsayılanlar bildirim etiketi içermez; Discord'un yerleşik başlık/üyelik bildirimlerini bot kontrol etmez. Ayrıntılar [PRIVACY.md](PRIVACY.md) ve [SECURITY.md](SECURITY.md).

### Sorun giderme

- **Node/npm bulunamadı:** Node 24 LTS kurun, yeni terminal açın. Node 20/22/25 yerine 24 kullanın.
- **setup duruyor:** ZIP'i çıkarın, gerçek Terminal/Komut İstemi kullanın; eski `.env` varsa güvenle yeniden adlandırın. Token kopyalarken boşluk/satır sonu bırakmayın. Ham tokenı hata raporuna koymayın.
- **Kayıt/başlangıç başarısız:** Doğru uygulama tokenı, Application ID ve Server ID; botun davet edilmiş olması ve ağ erişimini kontrol edin. Başka uygulamanın ID/token çiftini karıştırmayın. Developer Portal Interactions Endpoint URL boş kalmalı.
- **Komut yok:** register'ı bu sunucu için çalıştırın, Discord'u yenileyin; uygulama komut izinlerini, Manage Server ve Use Application Commands izinlerini kontrol edin. Forum/DM/başlık yerine normal metin kanalı kullanın.
- **İzin hatası:** Kullanıcı ve bot rollerini, @everyone ve kanalın üye/rol geçersiz kılmalarını kontrol edin. Botta Yönetici kullanmayın; ana kanal yavaş modunu kapatın. Timeout/kabul taramasını tamamlayın. Ana kanalı yeniden adlandırdıysanız yeni önizleme açın.
- **Düğme çalışmıyor:** Beş dakika dolmuş, bot yeniden başlamış veya düğme zaten kullanılmış olabilir. Yeni komut açın. Kısa aralıkta işlem yaptıysanız 5/60 saniye bekleyin. Bot çevrimdışıysa önce onu başlatın.
- **Oluşmuş olabilir:** Başlık listesini önce kontrol edin. Bot ağ hatasından sonra POST'u tekrarlamaz. Başarı yanıtı kaybolsa bile Discord'da başlık kalabilir. Yanlışlıkla tekrar oluşturursanız yetkili insan fazlalığı silebilir.
- **Başlık boş:** Beklenen davranış; bot başlangıç mesajı yazmaz. Bağlantıyı açıp katılın ve konuşmayı kendiniz başlatın.
- **60 dakika sonra silinmedi:** Ayar hareketsizlik sonrası liste görünürlüğüdür, silme/zamanlanmış kapanış değildir.

### Testler, katkı ve lisans

```text
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-node.mjs
```

`check`: önerilen Biome lint/format kuralları, katı TypeScript (bağımlılık tipleri dahil; yalnızca Node'un silebildiği TS sözdizimi), Node testleri, lockfile lisans/kayıt kaynağı/SHA-512/kurulum scripti kontrolü ve kaynak gizli bilgi örüntü taraması. Tarama sezgiseldir; tüm sırları tespit garantisi vermez. Audit bilinen kayıtlı açıkları kapsar. GitHub Actions aynı kontrolleri Windows, Ubuntu ve macOS 15 Intel üzerinde, Node 24 ile; ayrıca Bash yardımcı sözdizimi ve temiz fark kontrolünü çalıştırır. CI yalnızca `contents: read` iznine sahiptir, Actions SHA'larına sabitlenmiştir, bot tokenı kullanmaz.

Testler gerçek etkileşim işleyicisini sahte REST/Discord etkileşimleriyle çalıştırır: izin kaybı, overwrite sırası, bağlama, süre sonu, eşzamanlı onay, cooldown, tek POST ve belirsiz ağ hatası. Yapılandırılmamış gerçek main/register/setup programları geçici klasörde dosya yazmadan güvenle durmalıdır. **Canlı Discord sunucusu/tokenı, gerçek başlık oluşturma, mobil/ekran okuyucu, gizli token girişi ve kesintisiz hosting otomatik testlerde doğrulanmaz.** Kurulumdan sonra size ait deneme sunucusunda özel önizleme, vazgeç, bir oluşturma, izin kaldırma ve yeniden başlatma akışlarını elle doğrulayın; temizlik için başlığı siz silin. Bu çalışma VDS kullanmadı.

[CONTRIBUTING.md](CONTRIBUTING.md) katkı rehberini izleyin. Sorun/PR'da token, `.env`, kişisel kimlik veya özel konuşma paylaşmayın. [MIT](LICENSE) lisansı; garanti yoktur. Bağımlılıklar kendi lisanslarını korur.

## English

### Purpose and features

For a book club, event retrospective or community working group, run `/threadhaven` in an ordinary text channel. Review the title, visibility and fixed settings in a preview **only you can see**. Click **Create public thread** to create one public thread and receive a clickable link privately. **Discard** creates nothing.

- Restricted to organizers with Manage Server; permissions are fetched again at confirmation.
- Titles contain 3–80 characters: Unicode letters/numbers and plain punctuation. Trims edges, collapses ordinary spaces and normalizes accents to NFC. Rejects links, mentions, emoji, line breaks, Markdown and hidden direction controls. Similar-looking Unicode letters are not detected; a human must review the title.
- Fixed **60-minute inactivity** setting and **5-second slowmode**, shown before confirmation.
- No starter message or member invitations. The bot is the technical thread creator; the organizer opens the link, uses Discord's Join control if needed and starts the conversation themselves.
- Turkish/English previews and bilingual errors. Without `language`, Turkish Discord locale selects Turkish; other locales select English.

**Limits:** No private threads, forum/media posts, announcement threads, message reading, moderation, content scanning, automatic messages, invitations, reminders, thread editing/deletion or member rosters. This cannot automatically keep a discussion on topic. Discord's built-in thread creator is also available; this bot gives organizers a shared preview flow, visibility warning and fixed defaults.

**Public** means everyone who can view the parent channel can view the thread, not public internet access. The parent channel's permissions control access. Do not use this workflow for confidential support. Archiving is not deletion: Discord may remove the thread from the channel list after 60 inactive minutes; activity can extend the timer and archived threads can reopen. Slowmode-exempt members may bypass slowmode. The bot does not guarantee closure or deletion after one hour.

### Requirements

Windows, macOS or Linux; [Node.js 24 LTS](https://nodejs.org/) with npm; internet access; permission to invite applications and Manage Server in your Discord server. `node --version` must start with `v24.`. No source editing, database or separate web server. Each configuration supports one server. Run **one bot process** for an application; multiple processes do not share the RAM protections against duplicate creation.

### Developer Portal and invitation

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** and choose a recognizable name.
2. Copy **General Information → Application ID**. This is not a secret token.
3. Under **Bot**, create a bot if needed and use **Reset Token** to obtain your own bot token. Treat it as a password. Never post it in screenshots, GitHub, chats or CI secrets; this project's CI needs no token. If exposed, immediately reset it in the Portal and update local configuration.
4. Keep **Presence**, **Server Members** and **Message Content** privileged intents **disabled**. Only the nonprivileged `Guilds` intent is used.
5. Under **Installation**, use **Guild Install**, with `bot` and `applications.commands` scopes. Bot permissions: **View Channel** and **Create Public Threads** only. Do not grant **Administrator**. Permission integer: `34359739392`. Personal installation is not this bot's workflow.
6. Leave **Interactions Endpoint URL** blank; interactions arrive over the running Gateway connection. You may disable Public Bot if only installing your own application yourself.
7. In Discord, enable **User Settings → Advanced → Developer Mode**, right-click the server icon and **Copy Server ID**. Do not confuse channel and server IDs.
8. Setup below asks for Application ID, Server ID and a hidden token, then prints a clickable invitation locked to your chosen server. Open it, verify the server and permissions, and authorize the bot.

### Installation and configuration

Open [the repository](https://github.com/euglado/threadhaven), choose **Code → Download ZIP** and fully extract it. Work in the folder containing `package.json`. Keep the secret `.env` out of shared/cloud-backup folders. Review downloaded code before running it.

**Windows:** Install Node 24, double-click `setup.cmd` and answer its three questions. Token characters stay hidden. Open the invitation link. Then open `register.cmd`, followed by `start.cmd`. Leave the startup window open. Setup creates the right `.env` filename without an accidental `.txt` extension.

**macOS/Linux:** Open Terminal in the extracted project folder:

```bash
bash setup.sh
# Answer the questions and open the printed invitation link.
bash register.sh
bash start.sh
```

**Terminal alternative on every platform:**

```text
node --version
npm ci --ignore-scripts
npm run setup
npm run register
npm start
```

Setup requires an interactive terminal, not redirected input or CI. It hides the token and creates `.env` **without overwriting an existing file**. New Unix files use mode 0600; Windows access follows account/folder permissions. Keep the token in a secure password manager. To reconfigure, stop the bot, rename the existing `.env` securely outside the repository, repeat setup/register/start and securely remove the old token file. Do not leave a renamed backup in the repository.

Settings are `DISCORD_TOKEN` (secret bot token), `APPLICATION_ID` and `GUILD_ID` (allowed server). `.env.example` lists only key names. No source edits are needed. `.env` and `.env.*` are ignored by Git. CI must not receive a real token. Registration creates/updates only this server's `/threadhaven` command; it never bulk-replaces the application's other commands.

### Usage and permissions

Use an ordinary, non-age-restricted text channel with **parent-channel slowmode disabled**:

```text
/threadhaven title: October book club discussion language: en
```

Read the preview → create or discard → open the private result link. Threads are also accessible from the channel's thread list. Previews expire after five minutes, are single-use, and are bound to the user, server, channel and private preview message. Restarting loses pending previews; created threads remain. Run a new command if a button expires.

Organizers need **Manage Server**, **View Channel**, **Create Public Threads**, **Send Messages in Threads**, and **Use Application Commands** for Discord's command UI. The bot needs only **View Channel** and **Create Public Threads**. It does not send thread messages, so it requests no **Send Messages**, **Send Messages in Threads**, **Read Message History**, **Manage Threads**, **Manage Channels**, **Manage Roles** or **Administrator**. Replies use Discord interaction responses. Any bot role with Administrator stops the workflow. Human owners/administrators retain Discord's normal permission exceptions.

Before both preview and creation, the bot fetches current guild, roles, channel overwrites, organizer and bot memberships via official REST endpoints; cached permission decisions are not used. Pending membership screening and timeouts stop the action. A renamed parent requires a fresh preview. These API calls are not an atomic transaction: concurrent administrator changes can race checks and creation. Discord also enforces the bot's own permissions, but the human organizer's concurrent permission revocation cannot be guaranteed atomically.

Preview interval: five seconds per user. Creation-attempt interval: 60 seconds per channel, with exclusion while an operation remains in flight. Maximum 100 drafts, 100 simultaneous operations per gate and 1000 short-lived cooldown entries per gate. Full capacity rejects new work. Existing thread names/counts are not scanned; a new preview may create another thread with the same name. No automatic creation retry after network/REST errors. If the message says creation may have succeeded, **inspect the channel's thread list before retrying**.

### Keeping the bot online

Closing the startup window, putting the machine to sleep or losing connectivity stops responses. For continuous use, keep one process on your own computer or hosting account supporting Node 24. Typical panel settings: install `npm ci --ignore-scripts`, start `npm start`, Node version 24; enter the three settings as secret environment variables. Run registration once from your terminal after inviting the bot, not on every restart. Use the panel's single-process restart feature if needed. This project does not choose a host or configure your server. Free hosts may sleep; assess their privacy and logging policies.

For an update, stop the bot, preserve `.env` securely, review release changes, update the source, run `npm ci --ignore-scripts` and checks, then register/start. Stop with `Ctrl+C`. To uninstall, stop the process and remove the application from Discord. Authorized humans manage or remove remaining threads using Discord.

### Security and privacy

No database, draft files, analytics or forwarding to another service. RAM contains the title, parent name, language and user/server/channel/private-preview-message IDs for five-minute confirmation. Expired drafts are deleted on access; a 30-second cleanup removes idle expired drafts within about five minutes thirty seconds. Used/discarded drafts are removed immediately. Cooldown IDs may last 5/60 seconds plus up to 30 seconds of cleanup delay; active locks remain until their request finishes. The Gateway library may hold guild/role/channel metadata in working memory; message and member caches are disabled. Individual membership/role data is fetched for permission checks; no bulk member roster. Your secret `.env` remains on disk.

Application logs do not print titles, IDs, tokens or raw API errors. Discord retains threads, interactions and audit records under its own policies; archiving does not erase them. Private previews are visible only to you in Discord, but are not secret from Discord or device/hosting administrators. Do not enter confidential/personal information in titles. The bot supplies no mention notifications; Discord's native thread/membership notifications remain outside its control. See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

### Troubleshooting

- **Node/npm missing:** Install Node 24 LTS and reopen the terminal. Use 24 rather than Node 20/22/25.
- **Setup stops:** Fully extract ZIP; use an interactive terminal. Securely rename an existing `.env` before reconfiguration. Avoid whitespace/newlines in pasted tokens. Never attach a token to a bug report.
- **Registration/start fails:** Check matching application ID/token, server ID, invitation and network. Leave the Portal's Interactions Endpoint URL blank.
- **Command missing:** Register for this server, refresh Discord, and check Manage Server, Use Application Commands and integration command restrictions. Use an ordinary text channel rather than DM/forum/thread.
- **Permission error:** Check user/bot roles, @everyone and member/role channel overwrites. Remove Administrator from the bot, disable parent slowmode and resolve screening/timeouts. A renamed channel needs a new preview.
- **Button fails:** The preview may have expired, been used, or disappeared after restart. Make a new preview; wait 5/60 seconds if throttled. Start the bot first if offline.
- **Creation may have succeeded:** Inspect the thread list first. The bot does not repeat a failed POST. A thread can remain even if its success response was lost. A human can remove accidental duplicates.
- **Empty thread:** Expected. Open the link, join if needed, and start the discussion yourself.
- **Not deleted after 60 minutes:** This setting concerns inactivity/list visibility, not deletion or a scheduled closing time.

### Tests, contribution and license

```text
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/check-node.mjs
```

`check` runs recommended Biome lint/format, strict TypeScript including dependency types and erasable syntax, Node tests, lockfile license/registry/SHA-512/no-install-script checks and a source credential-pattern scan. Scanning is heuristic, not proof that every possible secret is absent. Audit covers known reported vulnerabilities. GitHub Actions repeats checks on Windows, Ubuntu and macOS 15 Intel with Node 24, plus Bash helper syntax and a clean diff. CI uses only `contents: read`, pinned Action SHAs and no bot token.

Tests exercise the real handler with mocked REST/Discord interactions: permission loss, overwrite ordering, binding, expiry, concurrent confirmation, cooldown, single POST and uncertain delivery. Real unconfigured main/register/setup programs must stop safely without writing files in a temporary directory. **Live Discord installation/token, real thread creation, mobile/screen-reader operation, hidden token entry and continuous hosting are not verified by automated tests.** After setup, manually check preview, discard, one creation, permission revocation and restart in your own test server. Delete the test thread yourself. No VDS was used in this work.

Follow [CONTRIBUTING.md](CONTRIBUTING.md). Never include a token, `.env`, personal IDs or private conversations in issues/PRs. [MIT](LICENSE) license, without warranty. Dependencies retain their own licenses.

## Official references / Resmi kaynaklar

- [Discord channel/thread creation API](https://docs.discord.com/developers/resources/channel#start-thread-without-message)
- [Thread permissions and lifecycle](https://docs.discord.com/developers/topics/threads)
- [Gateway intents](https://docs.discord.com/developers/events/gateway#gateway-intents)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)

Discord may change its UI and API; verify the Portal labels and current official rules when deploying.
