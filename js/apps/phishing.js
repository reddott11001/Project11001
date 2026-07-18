let gmailState = {};

const mailTemplates = [
    { from: 'security@webos-defender.com', subject: ' Security Warning: Your Account Has Been Hacked!', preview: 'Click this link to secure your account within 24 hours or your account will be deleted.', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'noreply@bank-bca.com', subject: ' Verify Your Bank Account', preview: 'We detected suspicious activity on your account. Verify now!', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'admin@webos-mail.com', subject: ' Email Storage Almost Full', preview: 'Your email is 98% full! Upgrade now or your email will be deactivated.', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'netflix@billing.info', subject: ' Your Netflix Subscription Will End', preview: 'Renew your subscription now or your account will be frozen. Click to update.', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'hr@job-offers.net', subject: ' Job Vacancy: $10,000/month Salary', preview: 'We like your profile! Work from home, great salary. Register now!', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'shopee@order-confirm.com', subject: ' Your Package Is Held at Customs', preview: 'Your package is held! Click to pay import duty and get your package.', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'support@microsoft-verify.com', subject: '? Microsoft Account: Suspicious Login', preview: 'Someone logged in from an unknown location. Verify your identity now!', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'admin@google-drive-share.com', subject: ' Someone Shared a File With You', preview: 'Important file shared with you! [Download] Secret_Document.pdf', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'info@free-vpn-service.com', subject: ' Premium VPN FREE for Life!', preview: 'Download our VPN and browse the internet without limits! Free for the next 24 hours!', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'admin@steam-community.com', subject: ' $100 Steam Gift Card FREE!', preview: 'You won a Steam Gift Card! Claim now before they run out!', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'admin@crypto-invest.com', subject: ' Bitcoin x10 in a week!', preview: 'Invest 1 BTC becomes 10 BTC! Real testimonials! Register right now!', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'support@whatsapp-security.com', subject: ' WhatsApp Web: New Device Detected', preview: 'Someone logged into your WhatsApp. Click to block unknown device.', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'admin@instagram-verify.com', subject: '? Instagram Blue Check Verification', preview: 'You are eligible for blue check verification! Click to activate.', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'noreply@shopee-promo.com', subject: ' Shopee Flash Sale 99% OFF!', preview: 'All items 99% off! Click now before they run out!', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'admin@dikti-info.com', subject: ' Full Overseas Master Scholarship', preview: 'You are selected to receive a full scholarship! Upload your documents now!', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'security@apple-id.com', subject: ' Apple ID: Unrecognized Purchase', preview: 'Purchase of Rp 2,000,000 from App Store. Not you? Click to cancel!', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'admin@gojek-promo.com', subject: ' Gojek Promo: FREE SHIPPING 1 MONTH', preview: 'Enjoy free shipping for a month! Activate now by clicking this link.', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'noreply@dana-payment.com', subject: ' Your DANA Balance is Rp 500,000!', preview: 'Your DANA balance increased by Rp 500,000! Claim now before it expires!', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'admin@spotify-premium.com', subject: ' Spotify Premium 6 Months FREE!', preview: 'Enjoy free Spotify Premium! Click to activate your premium account!', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'admin@tokopedia-seller.com', subject: ' Tokopedia: Your Store Suspended!', preview: 'Your store is suspended due to violation! Click to appeal.', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'noreply@bri-online.com', subject: ' BRI Internet Banking: Access Blocked', preview: 'Your internet banking access is temporarily blocked. Click to verify!', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'admin@disney-plus.com', subject: '? Disney+ 1 Year Rp 50,000!', preview: 'Special promo! Disney+ 1 year only Rp 50,000. Click now!', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'admin@alibaba-order.com', subject: ' Your Order From China Has Arrived', preview: 'Your package arrived in Jakarta! Click to track and pay customs fee of Rp 150,000.', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'noreply@ovo-promo.com', subject: ' 100% OVO Cashback!', preview: 'Every transaction 100% cashback! Claim the promo right now!', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'security@email-verify.com', subject: ' Verify Your Email Immediately!', preview: 'Your email will be deactivated! Verify within 24 hours or data will be deleted.', type: 'phishing', malware: 'trojan', detail: 'webos://free-download' },
    { from: 'admin@telkomsel.com', subject: ' 100GB Quota FREE!', preview: 'You received 100GB free quota! Click to activate now!', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
    { from: 'noreply@grab-promo.com', subject: ' GrabCar Rp 1,000 Anywhere!', preview: 'Special promo! GrabCar only Rp 1,000! Click to claim a voucher!', type: 'phishing', malware: 'spyware', detail: 'webos://free-download' },
    { from: 'admin@lazada-sale.com', subject: ' Lazada Birthday Sale 9.9!', preview: 'Discounts up to 99% + free shipping! Click now before they run out!', type: 'phishing', malware: 'adware', detail: 'webos://free-download' },
    { from: 'admin@pertamina-promo.com', subject: '? Pertamina: 50% Fuel Discount!', preview: 'Buy fuel at 50% off! Click to get a digital coupon!', type: 'phishing', malware: 'worm', detail: 'webos://free-download' },
];

const realEmails = [
    { from: 'budi@company.com', subject: 'Re: Monthly Report', preview: 'Thank you, I have reviewed the report. There are some minor revisions...', type: 'real' },
    { from: 'sari@friend.com', subject: 'Dinner Invitation', preview: "Hey! I'm having a BBQ at home on Saturday. You're coming, right?", type: 'real' },
    { from: 'boss@office.com', subject: 'Meeting Tomorrow at 10', preview: "Don't forget the meeting with the client tomorrow at 10. Prepare the presentation.", type: 'real' },
    { from: 'info@webos-update.com', subject: 'WebOS Update v10.1 Available', preview: 'New update available! Features: Performance improvement and bug fixes.', type: 'real' },
    { from: 'notifikasi@bank.com', subject: 'Transaction Successful: Rp 250,000', preview: 'Electricity payment of Rp 250,000 successful. Balance: Rp 1,250,000', type: 'real' },
    { from: 'admin@e-commerce.com', subject: 'Order #INV-2026 Shipped', preview: 'Your order is on its way! Estimated delivery 3-5 business days.', type: 'real' },
    { from: 'hrd@perusahaan.com', subject: 'June 2026 Salary Slip', preview: 'Your salary slip for June is available. Please check the HR portal.', type: 'real' },
    { from: 'noreply@newsletter.com', subject: " Newsletter: This Week's Tech News", preview: 'Top stories: Latest AI, crypto rising, and latest gadget reviews!', type: 'real' },
    { from: 'admin@game-platform.com', subject: ' Weekend Sale - 80% Off!', preview: 'Your favorite games 80% off! Only this weekend!', type: 'real' },
    { from: 'family@group.com', subject: 'Year-End Vacation Plan', preview: "How about we go to Bali this year? Let's check the tickets!", type: 'real' },
];

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generateEmails() {
    const result = [
        ...realEmails.map((e, i) => ({ ...e, id: 'real-' + i, time: `${Math.floor(Math.random() * 12 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2,'0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`, date: i < 5 ? 'Jun 28' : 'Jun 29', read: Math.random() > 0.4, trashed: false, starred: false })),
        ...mailTemplates.map((e, i) => ({ ...e, id: 'phish-' + i, time: `${Math.floor(Math.random() * 12 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2,'0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`, date: 'Jun 30', read: false, trashed: false, starred: false })),
    ];
    return shuffleArray(result);
}

function getGmailAttachment(malware) {
    const names = {
        trojan: ['Account_Security.exe', 'Data_Verification.zip', 'Secret_Document.pdf.exe'],
        worm: ['Special_Promo.zip', 'Free_Voucher.exe', 'Wedding_Invitation.doc.exe'],
        spyware: ['Job_Info.pdf.exe', 'Registration_Form.zip', 'Personal_Data.exe'],
        adware: ['Big_Discount.zip', 'Promo_Coupon.exe', 'Shopping_Voucher.doc.exe'],
    };
    const list = names[malware] || names.trojan;
    return list[Math.floor(Math.random() * list.length)];
}

let wormIntervals = {};

function triggerPhishingMalware(winId, type) {
    const overlay = document.getElementById(winId + '-mail-overlay');
    if (overlay) overlay.style.display = 'flex';

    switch(type) {
        case 'trojan': triggerPhishingTrojan(); break;
        case 'worm': triggerPhishingWorm(); break;
        case 'spyware': triggerPhishingSpyware(); break;
        case 'adware': triggerPhishingAdware(); break;
    }
}

function addVirusFiles(files) {
    files.forEach(vf => {
        if (!webosVirusFiles.find(v => v.name === vf.name && v.path.join('$ad') === vf.path.join('$ad'))) {
            webosVirusFiles.push(vf);
        }
        const folder = navigateToPath(vf.path);
        if (folder && folder.children) folder.children[vf.name] = { type: vf.type, ext: vf.ext, content: vf.content };
    });
}

function showVirusPopups(files, label, color, icon, count) {
    document.querySelectorAll('.virus-popup').forEach(el => el.remove());
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const popup = document.createElement('div');
            popup.className = 'virus-popup';
            popup.style.cssText = `position:fixed;top:${Math.random() * 60 + 10}%;left:${Math.random() * 60 + 10}%;background:#1a0000;border:3px solid ${color};border-radius:8px;padding:16px 24px;z-index:99999;box-shadow:0 0 30px ${color}80;animation:popupShake 0.1s infinite;max-width:320px;`;
            popup.innerHTML = `<div style="font-size:20px;margin-bottom:8px;color:${color};font-weight:bold;display:flex;align-items:center;gap:8px;"><span>${icon}</span><span>${label} DETECTED</span></div><div style="color:${color}aa;font-size:12px;margin-bottom:6px;text-align:left;"> File: ${files[i % files.length].name}<br> Path: ${files[i % files.length].path.join('$ad$ad')}<br> Threat: Critical!</div><button onclick="this.parentElement.remove()" style="padding:6px 16px;background:${color};color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">? Ignore</button>`;
            document.body.appendChild(popup);
            setTimeout(() => { if (popup.parentNode) popup.remove(); }, 6000 + i * 500);
        }, i * 400);
    }
}

function triggerPhishingTrojan() {
    webosInfected = true;
    const files = [
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'svchost.exe', type: 'file', ext: 'exe', content: '[TROJAN] Win32/Spyware.Gen - Remote Access Trojan$adnConnected to: 185.234.xx.xx:4444' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'winlogon.dll', type: 'file', ext: 'dll', content: '[TROJAN] Trojan.Downloader - Downloads additional malware' },
        { path: ['C:', 'Users', 'User', 'AppData', 'LocalLow', 'Sun', 'Java', 'tmp'], name: 'keylogger.sys', type: 'file', ext: 'sys', content: '[TROJAN] Keylogger - Captures keystrokes$adnData sent to: 45.67.xxx.xxx' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'Microsoft.Updater.dll', type: 'file', ext: 'dll', content: '[TROJAN] Fake Windows Update - Backdoor access' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu'], name: 'free_hack.exe', type: 'file', ext: 'exe', content: '[TROJAN] Trojan Horse - Original infection vector' },
    ];
    addVirusFiles(files);
    showVirusPopups(files, ' TROJAN HORSE', '#ff4444', '?', 6);
    addNotification(' TROJAN HORSE', 'Remote Access Trojan detected in the system!');
    saveWebOS();
}

const wormNames = ['svchost.exe', 'winupdate.exe', 'explorer_bk.exe', 'service_host.dll', 'msconfig.exe', 'runtime_broker.sys', 'security_health.exe', 'windows_defender.exe', 'system_guard.dll', 'ntoskrnl_bk.exe', 'taskhost.exe', 'csrss_bk.exe', 'lsass_bk.dll', 'services_bk.exe', 'spoolsv_bk.exe'];
const wormDirs = [
    ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'],
    ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'],
    ['C:', 'Users', 'User', 'AppData', 'LocalLow'],
    ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft'],
    ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'],
    ['C:', 'ProgramData', 'Microsoft', 'Windows', 'Start Menu'],
    ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows', 'INetCache'],
    ['C:', 'Users', 'User', 'AppData', 'Local', 'CrashDumps'],
];

function triggerPhishingWorm() {
    webosInfected = true;

    if (wormIntervals['main']) return;

    const files = [
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'worm_agent.exe', type: 'file', ext: 'exe', content: '[WORM] Self-replicating malware - Process: svchost.exe' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'svchost_bk.exe', type: 'file', ext: 'exe', content: '[WORM] Worm copy - Spawned by worm_agent.exe' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'updater_worm.dll', type: 'file', ext: 'dll', content: '[WORM] Worm module - Network propagation' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft'], name: 'installer.exe', type: 'file', ext: 'exe', content: '[WORM] Worm installer - USB autorun' },
    ];
    addVirusFiles(files);
    showVirusPopups(files, ' WORM', '#bb66ff', '', 4);

    addNotification(' WORM ACTIVE', 'Worm spreading! Replicating every 4 seconds!');

    let count = 0;
    const wormAds = [' FREE XXX VIDEO! Click here!', ' You won Rp 50,000,000! Claim now!', ' Male enhancement pills 100% effective!', ' Online casino - 200% deposit bonus!', ' Local girls want to meet you! Chat now!', ' 100% profit investment every day!', ' Free Netflix VIP account!', ' Free 0.1 BTC Bitcoin for you!'];
    wormIntervals['main'] = setInterval(() => {
        const mainFiles = [
            { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'worm_agent.exe' },
            { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'svchost_bk.exe' },
            { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'updater_worm.dll' },
            { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft'], name: 'installer.exe' },
        ];
        const anyAlive = mainFiles.some(mf => {
            const f = navigateToPath(mf.path);
            return f && f.children && f.children[mf.name];
        });
        if (!anyAlive) {
            clearInterval(wormIntervals['main']);
            delete wormIntervals['main'];
            document.querySelectorAll('.worm-ad-popup').forEach(el => el.remove());
            return;
        }
        for (let i = 0; i < 3; i++) {
            const dir = wormDirs[Math.floor(Math.random() * wormDirs.length)];
            const folder = navigateToPath(dir);
            if (folder && folder.children) {
                const name = wormNames[Math.floor(Math.random() * wormNames.length)];
                if (!folder.children[name]) {
                    folder.children[name] = { type: 'file', ext: name.split('.').pop(), content: '[WORM] Self-replicating - Generated at ' + new Date().toLocaleTimeString() };
                }
            }
        }
        const ad = wormAds[Math.floor(Math.random() * wormAds.length)];
        const popup = document.createElement('div');
        popup.className = 'worm-ad-popup';
        popup.style.cssText = `position:fixed;top:${Math.random()*80}%;left:${Math.random()*70}%;background:#1a0030;border:2px solid #bb66ff;border-radius:8px;padding:10px 14px;z-index:99998;box-shadow:0 0 20px #bb66ff66;max-width:220px;cursor:pointer;animation:adSlide 0.3s;`;
        popup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <span style="font-size:18px;"></span>
                <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;color:#bb66ff;font-size:12px;">?</span>
            </div>
            <div style="font-size:11px;color:#e0b0ff;margin:4px 0;">${ad}</div>
            <button onclick="this.closest('.worm-ad-popup').remove();openScamPage('$ad')" style="padding:4px 12px;background:#bb66ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:10px;width:100%;"> OPEN</button>
        `;
        document.body.appendChild(popup);
        setTimeout(() => { if (popup.parentNode) popup.remove(); }, 6000);
        count += 3;
        addNotification(' WORM REPLICATION', `${count} new worm files! Spreading throughout the system!`);
        saveWebOS();
    }, 4000);
    saveWebOS();
}

function triggerPhishingSpyware() {
    webosInfected = true;
    const files = [
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'data_miner.exe', type: 'file', ext: 'exe', content: '[SPYWARE] Data mining agent - Scanning browser history' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'spy_capture.sys', type: 'file', ext: 'sys', content: '[SPYWARE] Screen capture driver - Recording user activity' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu'], name: 'credential_stealer.dll', type: 'file', ext: 'dll', content: '[SPYWARE] Credential stealer - Extracting saved passwords' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'webos_logger.exe', type: 'file', ext: 'exe', content: '[SPYWARE] Keylogger - Logging all keystrokes' },
    ];
    addVirusFiles(files);
    showVirusPopups(files, '? SPYWARE', '#4488ff', '', 4);

    addNotification('? SPYWARE ACTIVE', 'Collecting your personal data...');

    const stolenData = [
        'Password: user123, Email: user@webos.com, Account: Instagram',
        'Browser cookies: 127 sessions saved',
        'Browsing history: last 3 days collected',
        'Contact list: 47 contacts exposed',
        'Credit card: ****1234 (saved)',
        'Private messages: 234 messages read',
        'Location data: GPS coordinates saved',
        'WiFi password: "rumah123" exposed',
    ];

    let sCount = 0;
    const spyInterval = setInterval(() => {
        if (sCount >= 12) { clearInterval(spyInterval); return; }
        addNotification('? SPYWARE: Data stolen', stolenData[Math.floor(Math.random() * stolenData.length)]);
        sCount++;
    }, 3000);

    addNotification('? SPYWARE: Password stolen', 'Your social media accounts exposed!');
    saveWebOS();
}

function triggerPhishingAdware() {
    webosInfected = true;
    const files = [
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'ad_injector.exe', type: 'file', ext: 'exe', content: '[ADWARE] Ad injector - Injecting ads into browser' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'popup_factory.dll', type: 'file', ext: 'dll', content: '[ADWARE] Popup generator - Spawning ad popups' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'browser_hijack.sys', type: 'file', ext: 'sys', content: '[ADWARE] Browser hijacker - Redirecting search results' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu'], name: 'ad_redirector.exe', type: 'file', ext: 'exe', content: '[ADWARE] Ad redirector - Traffic redirection module' },
    ];
    addVirusFiles(files);
    showVirusPopups(files, ' ADWARE', '#ffaa00', '', 3);
    addNotification(' ADWARE: Malicious ads active', 'Showing popup ads!');
    const ads = [' Win an iPhone 15! Click here!', ' Online loan disbursed in 5 minutes!', ' Herbal medicine 100% effective!', ' Online casino 200% bonus!', ' Crypto investment 100x profit!', ' Adults 18+ exclusive content!'];
    let aCount = 0;
    const adInterval = setInterval(() => {
        if (aCount >= 15) { clearInterval(adInterval); return; }
        const ad = ads[Math.floor(Math.random() * ads.length)];
        const popup = document.createElement('div');
        popup.className = 'adware-popup';
        popup.style.cssText = `position:fixed;bottom:60px;right:${Math.random()*200+20}px;background:#fff;border:2px solid #ffaa00;border-radius:8px;padding:12px 16px;z-index:99998;box-shadow:0 4px 20px rgba(0,0,0,0.3);max-width:250px;cursor:pointer;animation:adSlide 0.3s;`;
        popup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <span style="font-size:20px;"></span>
                <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;color:#999;font-size:14px;">?</span>
            </div>
            <div style="font-size:12px;color:#333;margin:6px 0;">${ad}</div>
            <button onclick="this.closest('.adware-popup').remove();openScamPage('$ad')" style="padding:4px 12px;background:#ffaa00;border:none;border-radius:4px;cursor:pointer;font-size:11px;width:100%;">Click here!</button>
        `;
        document.body.appendChild(popup);
        aCount++;
        setTimeout(() => { if (popup.parentNode) popup.remove(); }, 8000);
    }, 4000);
    saveWebOS();
}

let wifiRatInterval = null;

function triggerWiFiRAT() {
    webosInfected = true;
    const files = [
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows', 'WER', 'Temp', 'ReportQueue'], name: 'rat_shell.exe', type: 'file', ext: 'exe', content: '[RAT] Reverse Shell - Connected to 192.168.1.105:4443\nStatus: Active' },
        { path: ['C:', 'Users', 'User', 'AppData', 'LocalLow', 'Sun', 'Java', 'tmp', 'deployment', 'cache'], name: 'rat_keylog.sys', type: 'file', ext: 'sys', content: '[RAT] Keylogger - Capturing keystrokes\nLogged: 1428 keys' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'], name: 'rat_backdoor.dll', type: 'file', ext: 'dll', content: '[RAT] Backdoor Persistence - Auto-launch on boot\nInjected: svchost.exe' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp', 'Archive'], name: 'rat_screen.exe', type: 'file', ext: 'exe', content: '[RAT] Screen Capture - Streaming desktop\nRemote: 192.168.1.105:4444' },
    ];
    addVirusFiles(files);
    showVirusPopups(files, '? RAT - REMOTE ACCESS', '#00cc66', '', 4);
    addNotification('? RAT DETECTED', 'CoffeeShop_Free WiFi was a honeypot! Remote Access Trojan installed!');

    if (wifiRatInterval) clearInterval(wifiRatInterval);
    const ratPhrases = [
        'C:\\> connected to 192.168.1.105:4443',
        'C:\\> session established',
        'C:\\> capturing keystrokes...',
        'C:\\> transmitting desktop...',
        'C:\\> downloading C:\\Users\\User\\Documents\\*',
        'C:\\> injecting into svchost.exe...',
        'C:\\> DONE',
    ];
    let ratIdx = 0;
    wifiRatInterval = setInterval(() => {
        const coreFiles = [
            { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows', 'WER', 'Temp', 'ReportQueue'], name: 'rat_shell.exe' },
            { path: ['C:', 'Users', 'User', 'AppData', 'LocalLow', 'Sun', 'Java', 'tmp', 'deployment', 'cache'], name: 'rat_keylog.sys' },
            { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'], name: 'rat_backdoor.dll' },
            { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp', 'Archive'], name: 'rat_screen.exe' },
        ];
        const anyAlive = coreFiles.some(f => {
            const folder = navigateToPath(f.path);
            return folder && folder.children && folder.children[f.name];
        });
        if (!anyAlive) {
            clearInterval(wifiRatInterval);
            wifiRatInterval = null;
            document.querySelectorAll('.rat-popup').forEach(el => el.remove());
            addNotification('? RAT: Neutralized', 'Core RAT files deleted. Remote connection closed.');
            return;
        }
        const popup = document.createElement('div');
        popup.className = 'rat-popup';
        popup.style.cssText = `position:fixed;bottom:${60 + Math.random() * 30}px;right:${10 + Math.random() * 20}px;background:#0a0a0a;border:2px solid #00cc66;border-radius:6px;padding:12px 18px;z-index:99999;font-family:monospace;font-size:11px;color:#00cc66;box-shadow:0 0 20px #00cc6644;max-width:340px;`;
        popup.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;border-bottom:1px solid #00cc6633;padding-bottom:6px;">
                <span style="color:#00cc66;">?</span>
                <span style="font-weight:bold;color:#00ff88;">RAT - Reverse Shell</span>
                <span style="flex:1;"></span>
                <span style="color:#666;font-size:10px;">PID: ${Math.floor(Math.random()*9000+1000)}</span>
            </div>
            <div style="color:#00cc66;">${ratPhrases[ratIdx % ratPhrases.length]}</div>
            <div style="color:#666;margin-top:4px;font-size:10px;">Remote: 192.168.1.105:4443 | ${new Date().toLocaleTimeString()}</div>
        `;
        ratIdx++;
        document.body.appendChild(popup);
        setTimeout(() => { if (popup.parentNode) popup.remove(); }, 3000);
    }, 4000 + Math.floor(Math.random() * 3000));
    saveWebOS();
}

function triggerAdware2() {
    webosInfected = true;
    const files = [
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'adcore_engine.exe', type: 'file', ext: 'exe', content: '[ADWARE2] Core ad engine - Generates center popups' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'popup_driver.sys', type: 'file', ext: 'sys', content: '[ADWARE2] Popup driver - Kernel-level ad injection' },
        { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'ad_loader.dll', type: 'file', ext: 'dll', content: '[ADWARE2] Ad loader module - Communication server' },
        { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft'], name: 'ad_agent.exe', type: 'file', ext: 'exe', content: '[ADWARE2] Ad agent - Persistence service' },
    ];
    addVirusFiles(files);
    showVirusPopups(files, ' ADWARE 2.0', '#ff6600', '', 3);
    addNotification(' ADWARE 2.0: Aggressive popup ads active', 'Center-screen popups every 5 seconds!');
    let ad2Count = 0;
    const ad2Interval = setInterval(() => {
        const coreFiles = [
            { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Temp'], name: 'adcore_engine.exe' },
            { path: ['C:', 'Users', 'User', 'AppData', 'Local', 'Microsoft', 'Windows'], name: 'popup_driver.sys' },
            { path: ['C:', 'ProgramData', 'Microsoft', 'Windows', 'WER', 'Temp'], name: 'ad_loader.dll' },
            { path: ['C:', 'Users', 'User', 'AppData', 'Roaming', 'Microsoft'], name: 'ad_agent.exe' },
        ];
        const anyAlive = coreFiles.some(f => {
            const folder = navigateToPath(f.path);
            return folder && folder.children && folder.children[f.name];
        });
        if (!anyAlive) {
            clearInterval(ad2Interval);
            document.querySelectorAll('.adware2-popup').forEach(el => el.remove());
            addNotification('? ADWARE 2.0: Neutralized', 'Core files deleted. Popup ads stopped.');
            return;
        }
        ad2Count++;
        const bigAds = [
            ' CONGRATULATIONS! You won an iPhone 16 Pro! <span style="font-size:11px;display:block;margin-top:4px;">Claim your prize NOW!</span>',
            ' ONLINE CASINO - 500% BONUS! <span style="font-size:11px;display:block;margin-top:4px;">Deposit Rp 50,000 and get Rp 250,000 free!</span>',
            ' DOCTOR REVEALS: Secret to lasting 3 hours! <span style="font-size:11px;display:block;margin-top:4px;">Natural remedy - Order now!</span>',
            ' CRYPTO PUMP! 1000% in 24 hours! <span style="font-size:11px;display:block;margin-top:4px;">Insider group - Limited spots!</span>',
            ' HOT GIRLS in your area! <span style="font-size:11px;display:block;margin-top:4px;">Click to see who is online now!</span>',
            ' SPIN THE WHEEL - WIN $10,000! <span style="font-size:11px;display:block;margin-top:4px;">95% win rate! Try your luck!</span>',
        ];
        const popup = document.createElement('div');
        popup.className = 'adware2-popup';
        popup.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a0030,#330066);border:3px solid #ff6600;border-radius:16px;padding:28px 36px;z-index:99999;box-shadow:0 0 60px #ff660099,0 0 120px #ff660044;max-width:400px;width:90%;text-align:center;animation:adSlide 0.3s;`;
        popup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <span style="font-size:32px;"></span>
                <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;color:#ff6600;font-size:20px;font-weight:bold;">?</span>
            </div>
            <div style="font-size:16px;color:#ffcc00;margin:12px 0;line-height:1.4;">${bigAds[ad2Count % bigAds.length]}</div>
            <div style="font-size:11px;color:#ff880088;margin:8px 0;">sponsored by ad2.network</div>
            <button onclick="this.closest('.adware2-popup').remove();openScamPage('$bigAds[$ad2Count % $bigAds.length]')" style="padding:10px 32px;background:linear-gradient(to right,#ff6600,#ff3300);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;margin-top:8px;"> CLAIM NOW</button>
            <div style="color:#666;font-size:10px;margin-top:10px;">Ad 2.0 v${ad2Count} | Close this popup to dismiss</div>
        `;
        document.body.appendChild(popup);
        addNotification(' ADWARE 2.0: New popup', `Popup ad #${ad2Count} displayed - center screen`);
        saveWebOS();
    }, 5000);
}

function stopWorm() {
    Object.keys(wormIntervals).forEach(k => {
        clearInterval(wormIntervals[k]);
        delete wormIntervals[k];
    });
}

function triggerRansomware() {
    if (ransomwareState.infected) return;
    ransomwareState.infected = true;
    ransomwareState.timerStart = Date.now();

    const coreFile = { path: ['C:', 'Windows', 'System32', 'drivers'], name: 'gotfucked.sys', type: 'file', ext: 'sys', content: '[GOTFUCKED RANSOMWARE CORE - DO NOT DELETE]' };
    const coreFolder = navigateToPath(coreFile.path);
    if (coreFolder && coreFolder.children) {
        coreFolder.children[coreFile.name] = { type: 'file', ext: 'sys', content: coreFile.content };
    }
    if (!webosVirusFiles.find(v => v.name === coreFile.name && v.path.join('\\') === coreFile.path.join('\\'))) {
        webosVirusFiles.push(coreFile);
    }

    webosInfected = true;
    saveWebOS();

    showRansomPopup();
    startRansomTimer();
    lockDesktopIcons();

    addNotification(' RANSOMWARE DETECTED', 'All files, folders, and apps are locked by GotFucked ransomware!');
}

function showRansomPopup() {
    if (ransomwareState.popupEl) ransomwareState.popupEl.remove();
    if (!ransomwareState.infected) return;

    const popup = document.createElement('div');
    ransomwareState.popupEl = popup;
    popup.id = 'ransomware-popup';
    popup.style.cssText = `
        position:fixed;bottom:20px;right:20px;z-index:999999;
        font-family:'Segoe UI',sans-serif;
    `;

    popup.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a0000,#330000,#1a0000);border:3px solid #ff0000;border-radius:16px;padding:24px 30px;max-width:420px;width:90vw;box-shadow:0 0 80px #ff000066,0 0 160px #ff000033;position:relative;">
            <div style="font-size:36px;margin-bottom:6px;"></div>
            <div style="font-size:22px;color:#ff0000;font-weight:900;text-shadow:0 0 15px #ff0000;margin-bottom:3px;animation:ransomPulse 1s infinite;">GOT FUCKED!</div>
            <div style="font-size:11px;color:#ff4444;font-weight:bold;margin-bottom:12px;">GotFucked Ransomware v2.0</div>
            
            <div style="background:#0a0000;border:1px solid #ff000044;border-radius:8px;padding:10px;margin-bottom:12px;">
                <div style="color:#ff6666;font-size:11px;line-height:1.5;text-align:left;">
                     Files encrypted! Only Browser works.<br>
                     <span id="ransom-timer" style="color:#ff0000;font-weight:bold;">24:00:00</span> until deletion!
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <button onclick="openApp('browser');setTimeout(()=>{const w=Object.values(activeWindows||{}).find(w=>w.appId==='browser'&&!w.closed);if(w&&typeof browserNavigate==='function')browserNavigate(w.id,'webos://bitcoin-motherfuckers');},500);" style="padding:10px 16px;background:linear-gradient(to right,#ff6600,#ff3300);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:bold;width:100%;letter-spacing:0.5px;"> BITCOIN MOTHERFUCKERS - PAY 0.5 BTC</button>
            </div>

            <div style="margin-bottom:10px;">
                <input id="ransom-key-input" type="text" placeholder="Decryption key..." style="width:100%;padding:7px 10px;background:#0a0000;border:1px solid #ff000044;border-radius:6px;color:#fff;font-size:11px;text-align:center;outline:none;" onkeydown="if(event.key==='Enter')attemptRansomDecrypt();">
                <button onclick="attemptRansomDecrypt()" style="margin-top:5px;padding:6px 14px;background:#ff0000;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:10px;font-weight:bold;width:100%;">UNLOCK</button>
            </div>

            <div style="color:#555;font-size:8px;text-align:center;margin-top:8px;">Bitcoin Motherfuckers | 0.5 BTC required</div>
        </div>
    `;

    document.body.appendChild(popup);

    const style = document.createElement('style');
    style.id = 'ransom-style';
    style.textContent = `
        @keyframes ransomPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.03);} }
    `;
    document.head.appendChild(style);
}

function lockDesktopIcons() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const appId = icon.getAttribute('data-app');
        if (appId === 'browser' || appId === 'gotfucked-decryptor') return;
        const origDbl = icon.getAttribute('ondblclick');
        const origHtml = icon.innerHTML;
        icon.setAttribute('data-orig-ondblclick', origDbl || '');
        icon.setAttribute('data-orig-html', origHtml);
        icon.setAttribute('ondblclick', `showRansomLocked('${appId}')`);
        icon.innerHTML = `<div class="icon-img">🔒</div><span> Locked</span>`;
    });
}

function unlockDesktopIcons() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        const origDbl = icon.getAttribute('data-orig-ondblclick');
        const origHtml = icon.getAttribute('data-orig-html');
        if (origDbl !== null) {
            icon.setAttribute('ondblclick', origDbl);
            icon.removeAttribute('data-orig-ondblclick');
        }
        if (origHtml !== null) {
            icon.innerHTML = origHtml;
            icon.removeAttribute('data-orig-html');
        }
    });
}

function runGotFuckedDecryptor() {
    ransomwareState.infected = false;
    unlockDesktopIcons();
    Object.keys(activeWindows).forEach(id => {
        const w = activeWindows[id];
        if (w && w.appId === 'file-explorer' && !w.closed) {
            const el = document.getElementById(id);
            if (el && typeof renderFEContent === 'function') {
                const feState = el.querySelector('.fe-path-bar');
                if (feState) renderFEContent(id);
            }
        }
    });
    addNotification(' FILES DECRYPTED', 'All files, apps, and folders unlocked! But ransomware CORE FILE still exists. Open CMD and type: del gotfucked.sys');
}

function showRansomLocked(appId) {
    addNotification(' App Locked', `${appId} is encrypted by GotFucked ransomware! Pay 0.5 BTC to unlock.`);
}

function updateRansomTimer() {
    if (!ransomwareState.infected || !ransomwareState.timerStart) return;
    
    const elapsed = Date.now() - ransomwareState.timerStart;
    const totalMs = 24 * 60 * 60 * 1000;
    const remaining = Math.max(0, totalMs - elapsed);
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    const timerEl = document.getElementById('ransom-timer');
    if (timerEl) {
        timerEl.textContent = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    }
    
    if (remaining <= 0) {
        deleteAllEncryptedFiles();
    }
}

function startRansomTimer() {
    if (ransomwareState.timerInterval) clearInterval(ransomwareState.timerInterval);
    ransomwareState.timerInterval = setInterval(updateRansomTimer, 1000);
    updateRansomTimer();
}

function stopRansomTimer() {
    if (ransomwareState.timerInterval) {
        clearInterval(ransomwareState.timerInterval);
        ransomwareState.timerInterval = null;
    }
}

function deleteAllEncryptedFiles() {
    stopRansomTimer();
    
    ransomwareState.encryptedFiles.forEach(ef => {
        const folder = navigateToPath(ef.path.slice(0, -1));
        if (folder && folder.children) {
            delete folder.children[ef.name];
        }
    });
    
    ransomwareState.encryptedFiles = [];
    ransomwareState.infected = false;
    unlockDesktopIcons();
    
    if (ransomwareState.popupEl) {
        ransomwareState.popupEl.remove();
        ransomwareState.popupEl = null;
    }
    
    saveWebOS();
    addNotification(' FILES DELETED', 'Ransomware timer expired! All encrypted files have been permanently deleted.');
}

function attemptRansomDecrypt() {
    const input = document.getElementById('ransom-key-input');
    if (!input) return;
    
    const key = input.value.trim();
    
    if (key === ransomwareState.validKey) {
        ransomwareState.encryptedFiles.forEach(ef => {
            const folder = navigateToPath(ef.path.slice(0, -1));
            if (folder && folder.children) {
                folder.children[ef.name] = {
                    type: 'file',
                    ext: ef.originalExt,
                    content: ef.originalContent
                };
            }
        });
        
        ransomwareState.encryptedFiles = [];
        ransomwareState.infected = false;
        stopRansomTimer();
        unlockDesktopIcons();
        
        if (ransomwareState.popupEl) {
            ransomwareState.popupEl.remove();
            ransomwareState.popupEl = null;
        }
        
        saveWebOS();
        addNotification(' FILES DECRYPTED', 'GotFucked ransomware removed! All files restored.');
    } else {
        input.style.borderColor = '#ff0000';
        input.value = '';
        input.placeholder = 'WRONG KEY! Try again...';
        setTimeout(() => {
            input.style.borderColor = '#ff000044';
            input.placeholder = 'Enter key to decrypt...';
        }, 2000);
    }
}

function clearRansomwareState() {
    ransomwareState.infected = false;
    ransomwareState.encryptedFiles = [];
    ransomwareState.timerStart = null;
    stopRansomTimer();
    if (ransomwareState.popupEl) {
        ransomwareState.popupEl.remove();
        ransomwareState.popupEl = null;
    }
}

// Gmail UI
function renderGmail(winId) {
    const body = document.getElementById(winId + '-browser-content');
    if (!body) return;

    // Try to load saved state first
    const savedState = loadGmailState();
    const emails = savedState ? savedState.emails : generateEmails();
    const currentView = savedState ? savedState.currentView : 'inbox';
    const deletedCount = savedState ? savedState.deletedCount : 0;
    
    gmailState[winId] = { emails: emails, currentView: currentView, selectedId: null, deletedCount: deletedCount };

    const html = `
    <style>
        .gmail-app { display:flex;height:100%;font-family:'Segoe UI',sans-serif;background:#fff; }
        .gmail-sidebar { width:200px;background:#f5f5f5;border-right:1px solid #e0e0e0;padding:12px 0;overflow-y:auto;flex-shrink:0; }
        .gmail-compose { margin:8px 12px;padding:12px;background:#fff;border:1px solid #ddd;border-radius:16px;text-align:center;cursor:pointer;font-weight:bold;color:#444;box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        .gmail-compose:hover { box-shadow:0 2px 6px rgba(0,0,0,0.15); }
        .gmail-nav-item { padding:6px 20px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:10px;color:#444;border-radius:0 16px 16px 0;margin-right:8px; }
        .gmail-nav-item:hover { background:#e8e8e8; }
        .gmail-nav-item.active { background:#d3e3fd;color:#1a73e8;font-weight:bold; }
        .gmail-nav-item .badge { margin-left:auto;background:#1a73e8;color:#fff;border-radius:12px;padding:1px 8px;font-size:11px; }
        .gmail-main { flex:1;display:flex;flex-direction:column;overflow:hidden; }
        .gmail-toolbar { padding:8px 16px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;gap:8px;background:#fff;flex-shrink:0; }
        .gmail-toolbar button { padding:6px 12px;border:none;background:transparent;border-radius:4px;cursor:pointer;font-size:12px;color:#555; }
        .gmail-toolbar button:hover { background:#f0f0f0; }
        .gmail-search { flex:1;max-width:400px;padding:6px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px; }
        .gmail-email-list { flex:1;overflow-y:auto; }
        .gmail-email-item { display:flex;align-items:center;padding:8px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;gap:8px; }
        .gmail-email-item:hover { background:#f5f5f5; }
        .gmail-email-item.unread { background:#f5f9ff; }
        .gmail-email-item.unread .gmail-email-subject { font-weight:bold; }
        .gmail-email-sender { width:180px;font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0; }
        .gmail-email-subject { flex:1;font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .gmail-email-preview { font-size:12px;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;flex-shrink:0; }
        .gmail-email-date { width:60px;font-size:12px;color:#999;text-align:right;flex-shrink:0; }
        .gmail-email-body { flex:1;overflow-y:auto;padding:20px 24px; }
        .gmail-email-detail-header { border-bottom:1px solid #e0e0e0;padding-bottom:16px;margin-bottom:16px; }
        .gmail-email-detail-from { font-size:14px;color:#333;margin-bottom:4px; }
        .gmail-email-detail-subject { font-size:16px;font-weight:bold;color:#222;margin-bottom:8px; }
        .gmail-email-detail-to { font-size:12px;color:#999; }
        .gmail-email-detail-body { font-size:14px;line-height:1.6;color:#444; }
        .gmail-attachment { display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:#f0f0f0;border-radius:4px;margin:4px;cursor:pointer;font-size:12px;border:1px solid #ddd; }
        .gmail-attachment:hover { background:#e0e0e0; }
        .gmail-empty { display:flex;align-items:center;justify-content:center;flex:1;color:#999;font-size:14px; }
        .gmail-back-btn { display:none;padding:6px 12px;border:none;background:transparent;cursor:pointer;font-size:16px; }
        .gmail-loading-bar { height:3px;background:#1a73e8;width:0%;transition:width 0.3s; }
        @keyframes adSlide { from { transform:translateX(100px);opacity:0; } to { transform:translateX(0);opacity:1; } }
    </style>
    <div class="gmail-app">
        <div class="gmail-sidebar">
            <div class="gmail-compose" onclick="gmailNewCompose('${winId}')">✏️ Compose Email</div>
            <div class="gmail-nav-item active" data-view="inbox" onclick="gmailSwitchView('${winId}','inbox')">📥 Inbox <span class="badge">${emails.length}</span></div>
            <div class="gmail-nav-item" data-view="starred" onclick="gmailSwitchView('${winId}','starred')">⭐ Starred</div>
            <div class="gmail-nav-item" data-view="sent" onclick="gmailSwitchView('${winId}','sent')">📤 Sent</div>
            <div class="gmail-nav-item" data-view="drafts" onclick="gmailSwitchView('${winId}','drafts')">📝 Drafts</div>
            <div class="gmail-nav-item" data-view="spam" onclick="gmailSwitchView('${winId}','spam')">🚫 Spam <span class="badge" style="background:#c62828;">${emails.filter(e => e.type === 'phishing').length}</span></div>
            <div class="gmail-nav-item" data-view="trash" onclick="gmailSwitchView('${winId}','trash')">🗑️ Trash <span class="badge" style="background:#c62828;">0</span></div>
        </div>
        <div class="gmail-main" id="${winId}-gmail-main">
            <div class="gmail-toolbar">
                <button onclick="gmailRefresh('${winId}')">↻</button>
                <button onclick="gmailMarkRead('${winId}')">✉</button>
                <button onclick="gmailDelete('${winId}')">🗑</button>
                <input class="gmail-search" placeholder="Search email..." onkeyup="gmailSearch('${winId}', this.value)">
            </div>
            <div id="${winId}-gmail-loading" class="gmail-loading-bar" style="width:0;"></div>
            <div id="${winId}-gmail-content" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
                ${gmailRenderList(winId)}
            </div>
        </div>
    </div>`;

    body.innerHTML = html;
    
    // Update badges after render to reflect saved state
    setTimeout(() => updateGmailSidebarBadges(winId), 0);
}

function gmailRenderList(winId) {
    const state = gmailState[winId];
    if (!state) return '<div class="gmail-empty">Loading...</div>';

    const filtered = state.emails.filter(e => {
        if (state.currentView === 'trash') return e.trashed;
        if (e.trashed) return false;
        if (state.currentView === 'spam') return e.type === 'phishing';
        if (state.currentView === 'starred') return e.starred;
        return true;
    });

    if (filtered.length === 0) return '<div class="gmail-empty"> No emails</div>';

    return `<div class="gmail-email-list">${filtered.map(e => `
        <div class="gmail-email-item ${e.read ? '' : 'unread'}" onclick="gmailOpenEmail('${winId}','${e.id}')">
            <span></span>
            <span class="gmail-email-sender">${e.from}</span>
            <span class="gmail-email-subject">${e.subject}</span>
            <span class="gmail-email-preview">${e.preview}</span>
            <span class="gmail-email-date">${e.date}</span>
        </div>
    `).join('')}</div>`;
}

function gmailOpenEmail(winId, emailId) {
    const state = gmailState[winId];
    if (!state) return;
    const email = state.emails.find(e => e.id === emailId);
    if (!email) return;
    email.read = true;
    state.selectedId = emailId;
    saveGmailState();

    const content = document.getElementById(winId + '-gmail-content');
    if (!content) return;

    const loading = document.getElementById(winId + '-gmail-loading');
    if (loading) loading.style.width = '60%';
    setTimeout(() => { if (loading) loading.style.width = '100%'; }, 200);

    if (email.type === 'phishing') {
        const attachmentName = getGmailAttachment(email.malware);

        content.innerHTML = `
            <div style="flex:1;overflow-y:auto;padding:20px 24px;">
                <button class="gmail-back-btn" style="display:inline-block;margin-bottom:12px;" onclick="gmailRenderListView('${winId}')">← Back</button>
                <div class="gmail-email-detail-header">
                    <div class="gmail-email-detail-subject">${email.subject}</div>
                    <div class="gmail-email-detail-from"><strong>From:</strong> ${email.from}</div>
                    <div class="gmail-email-detail-to"><strong>To:</strong> user@webos.com</div>
                </div>
                <div class="gmail-email-detail-body">
                    <p>Dear Valued Customer,</p>
                    <p>${email.preview}</p>
                    <p style="margin-top:16px;">Click the link below for further action:</p>
                    <div style="margin:16px 0;">
                        <span style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;border-radius:4px;cursor:pointer;font-weight:bold;text-decoration:none;" onclick="triggerPhishingMalware('${winId}', '${email.malware}');this.style.background='#888';this.textContent=' Loading...';">🔓 CONFIRM NOW</span>
                    </div>
                    <p style="color:#999;font-size:12px;">Or click this link: <span style="color:#1a73e8;cursor:pointer;" onclick="triggerPhishingMalware('${winId}', '${email.malware}')">verify.link.${Math.random().toString(36).slice(2,6)}.com</span></p>
                </div>
                <div style="border-top:1px solid #e0e0e0;padding-top:16px;margin-top:16px;">
                    <strong style="font-size:13px;"> Attachments:</strong>
                    <div style="margin-top:8px;">
                        <div class="gmail-attachment" onclick="triggerPhishingMalware('${winId}', '${email.malware}')">
                             ${attachmentName} (${Math.floor(Math.random()*900+100)} KB)
                        </div>
                        <div class="gmail-attachment" onclick="triggerPhishingMalware('${winId}', '${email.malware}')">
                             ${getGmailAttachment(email.malware)} (${Math.floor(Math.random()*900+100)} KB)
                        </div>
                    </div>
                </div>
                <div style="margin-top:24px;padding:12px;background:#f9f9f9;border-radius:8px;font-size:12px;color:#888;">
                     WebOS Mail - Protected by WebOS Defender
                </div>
            </div>`;
        setTimeout(() => { if (loading) loading.style.width = '0'; }, 500);
        return;
    }

    content.innerHTML = `
        <div style="flex:1;overflow-y:auto;padding:20px 24px;">
            <button class="gmail-back-btn" style="display:inline-block;margin-bottom:12px;" onclick="gmailRenderListView('${winId}')">← Back</button>
            <div class="gmail-email-detail-header">
                <div class="gmail-email-detail-subject">${email.subject}</div>
                <div class="gmail-email-detail-from"><strong>From:</strong> ${email.from}</div>
                <div class="gmail-email-detail-to"><strong>To:</strong> user@webos.com</div>
            </div>
            <div class="gmail-email-detail-body">
                <p>${email.preview}</p>
                <p style="color:#999;margin-top:16px;">Best regards,<br>${email.from}</p>
            </div>
        </div>`;
    setTimeout(() => { if (loading) loading.style.width = '0'; }, 500);
}

function gmailRenderListView(winId) {
    const content = document.getElementById(winId + '-gmail-content');
    if (content) content.innerHTML = gmailRenderList(winId);
}

function gmailSwitchView(winId, view) {
    const state = gmailState[winId];
    if (!state) return;
    state.currentView = view;
    document.querySelectorAll(`#${winId}-gmail-main .gmail-nav-item`).forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');

    const content = document.getElementById(winId + '-gmail-content');
    if (content) content.innerHTML = gmailRenderList(winId);
    updateGmailSidebarBadges(winId);
    saveGmailState();
}

function gmailNewCompose(winId) {
    addNotification(' Mail', 'Compose feature under development. Try clicking spam!');
}

function gmailRefresh(winId) {
    const loading = document.getElementById(winId + '-gmail-loading');
    if (loading) loading.style.width = '100%';
    const content = document.getElementById(winId + '-gmail-content');
    if (content) content.innerHTML = gmailRenderList(winId);
    setTimeout(() => { if (loading) loading.style.width = '0'; }, 800);
}

function gmailMarkRead(winId) {
    const state = gmailState[winId];
    if (!state) return;
    state.emails.forEach(e => e.read = true);
    saveGmailState();
    gmailRenderListView(winId);
}

function gmailDelete(winId) {
    const state = gmailState[winId];
    if (!state) return;
    const selected = state.emails.find(e => e.id === state.selectedId);
    if (!selected) {
        addNotification(' Gmail', 'Open an email first, then click delete.');
        return;
    }
    if (state.currentView === 'trash') {
        state.emails = state.emails.filter(e => e.id !== state.selectedId);
    } else {
        selected.trashed = true;
    }
    state.deletedCount++;
    state.selectedId = null;
    
    if (state.deletedCount % 5 === 0) {
        const fresh = generateEmails();
        const added = fresh.slice(0, 5).map(e => ({ ...e, id: 'new-' + Date.now() + '-' + Math.random().toString(36).slice(2,6), read: false, trashed: false, starred: false }));
        state.emails.push(...added);
        addNotification(' Gmail', '5 new emails arrived in your inbox!');
    }
    
    saveGmailState();
    gmailRenderListView(winId);
    updateGmailSidebarBadges(winId);
}

function saveGmailState() {
    const state = gmailState[Object.keys(gmailState)[0]];
    if (!state) return;
    try {
        localStorage.setItem('gmailState', JSON.stringify({
            emails: state.emails,
            currentView: state.currentView,
            deletedCount: state.deletedCount
        }));
    } catch(e) {
        console.error('Failed to save Gmail state:', e);
    }
}

function loadGmailState() {
    try {
        const saved = localStorage.getItem('gmailState');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch(e) {
        console.error('Failed to load Gmail state:', e);
    }
    return null;
}

function updateGmailSidebarBadges(winId) {
    const state = gmailState[winId];
    if (!state) return;
    
    const inboxCount = state.emails.filter(e => !e.trashed).length;
    const spamCount = state.emails.filter(e => !e.trashed && e.type === 'phishing').length;
    const trashCount = state.emails.filter(e => e.trashed).length;
    
    const inboxBadge = document.querySelector(`#${winId}-body .gmail-nav-item[data-view="inbox"] .badge`);
    const spamBadge = document.querySelector(`#${winId}-body .gmail-nav-item[data-view="spam"] .badge`);
    const trashBadge = document.querySelector(`#${winId}-body .gmail-nav-item[data-view="trash"] .badge`);
    
    if (inboxBadge) inboxBadge.textContent = inboxCount;
    if (spamBadge) spamBadge.textContent = spamCount;
    if (trashBadge) trashBadge.textContent = trashCount;
}

function gmailSearch(winId, query) {
    // just visual feedback - search is not fully implemented
}

let decryptorDownloaded = false;

function downloadDecryptor() {
    if (decryptorDownloaded) {
        openApp('gotfucked-decryptor');
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'decryptor-download-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#1a0000;border:2px solid #ff0000;border-radius:16px;padding:32px 40px;text-align:center;min-width:380px;box-shadow:0 0 40px rgba(255,0,0,0.4);">' +
        '<div style="font-size:48px;margin-bottom:12px;">🗝️</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:4px;">Downloading GotFucked Decryptor</div>' +
        '<div id="dl-status" style="color:#888;font-size:12px;margin-bottom:16px;">Connecting to server...</div>' +
        '<div style="width:100%;height:8px;background:#333;border-radius:4px;overflow:hidden;margin-bottom:8px;">' +
            '<div id="dl-bar" style="width:0%;height:100%;background:linear-gradient(to right,#ff0000,#ff4444);border-radius:4px;transition:width 0.2s;"></div>' +
        '</div>' +
        '<div id="dl-percent" style="color:#ff4444;font-size:13px;font-weight:bold;">0%</div>' +
        '<div id="dl-speed" style="color:#555;font-size:10px;margin-top:8px;">0 KB/s</div>' +
    '</div>';
    document.body.appendChild(overlay);

    const statusEl = document.getElementById('dl-status');
    const barEl = document.getElementById('dl-bar');
    const percentEl = document.getElementById('dl-percent');
    const speedEl = document.getElementById('dl-speed');

    const steps = [
        { pct: 10, status: 'Connecting to server...', speed: '128 KB/s' },
        { pct: 25, status: 'Downloading decryptor binary...', speed: '512 KB/s' },
        { pct: 45, status: 'Verifying digital signature...', speed: '1.2 MB/s' },
        { pct: 65, status: 'Decrypting payload...', speed: '890 KB/s' },
        { pct: 80, status: 'Installing to system...', speed: '640 KB/s' },
        { pct: 92, status: 'Creating desktop shortcut...', speed: '256 KB/s' },
        { pct: 100, status: 'Installation complete!', speed: '0 KB/s' },
    ];

    let stepIdx = 0;
    const interval = setInterval(function() {
        if (stepIdx >= steps.length) {
            clearInterval(interval);
            decryptorDownloaded = true;
            createDecryptorDesktopIcon();
            setTimeout(function() {
                const ov = document.getElementById('decryptor-download-overlay');
                if (ov) ov.remove();
                addNotification(' 🗝️ GotFucked Decryptor Installed', 'The decryptor is now on your desktop. Double-click to run it.');
            }, 500);
            return;
        }
        const step = steps[stepIdx];
        if (statusEl) statusEl.textContent = step.status;
        if (barEl) barEl.style.width = step.pct + '%';
        if (percentEl) percentEl.textContent = step.pct + '%';
        if (speedEl) speedEl.textContent = step.speed;
        stepIdx++;
    }, 800);
}

function createDecryptorDesktopIcon() {
    const existingIcon = document.querySelector('.desktop-icon[data-app="gotfucked-decryptor"]');
    if (existingIcon) return;
    const di = document.getElementById('desktop-icons');
    if (!di) return;
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-app', 'gotfucked-decryptor');
    icon.setAttribute('ondblclick', 'openApp(\'gotfucked-decryptor\')');
    icon.innerHTML = '<div class="icon-img">🗝️</div><span>GotFucked Decryptor</span>';
    icon.addEventListener('click', function(e) {
        if (typeof iconDragState !== 'undefined' && iconDragState.hasMoved) {
            iconDragState.hasMoved = false;
            return;
        }
        e.stopPropagation();
        document.querySelectorAll('.desktop-icon').forEach(function(i) { i.classList.remove('selected'); });
        icon.classList.add('selected');
    });
    icon.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.desktop-icon').forEach(function(i) { i.classList.remove('selected'); });
        icon.classList.add('selected');
        if (typeof showIconContextMenu !== 'undefined') showIconContextMenu(e.clientX, e.clientY, 'gotfucked-decryptor', true);
    });
    if (typeof handleIconMouseDown !== 'undefined') {
        icon.addEventListener('mousedown', handleIconMouseDown);
    }
    di.appendChild(icon);
    icon.style.left = '-1000px';
    icon.style.top = '-1000px';
    const MAX_ROWS = 7;
    const occupiedCells = new Set();
    document.querySelectorAll('.desktop-icon').forEach(function(ic) {
        const l = parseInt(ic.style.left);
        const t = parseInt(ic.style.top);
        if (!isNaN(l) && !isNaN(t) && l >= 0 && t >= 0) {
            occupiedCells.add(l + ',' + t);
        }
    });
    const ICON_W = 80;
    const ICON_H = 90;
    const GAP_X = 10;
    const GAP_Y = 10;
    let placed = false;
    for (let col = 0; col < 20 && !placed; col++) {
        for (let row = 0; row < MAX_ROWS && !placed; row++) {
            const x = 10 + col * (ICON_W + GAP_X);
            const y = 10 + row * (ICON_H + GAP_Y);
            if (!occupiedCells.has(x + ',' + y)) {
                icon.style.left = x + 'px';
                icon.style.top = y + 'px';
                placed = true;
            }
        }
    }
    if (!placed) {
        icon.style.left = '10px';
        icon.style.top = '10px';
    }
}

function renderGotFuckedDecryptor(winId) {
    const body = document.getElementById(winId + '-body');
    if (!body) return;
    body.innerHTML = '<div id="' + winId + '-decryptor-container" style="height:100%;overflow:hidden;background:#0a0a0a;color:#fff;font-family:\'Segoe UI\',sans-serif;"></div>';
    const container = document.getElementById(winId + '-decryptor-container');
    if (!container) return;
    showDecryptorTerms(container, winId);
}

function showDecryptorTerms(container, winId) {
    container.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;background:#0a0a0a;">' +
        '<div style="background:#1a0000;border-bottom:2px solid #ff0000;padding:20px 24px;display:flex;align-items:center;gap:12px;">' +
            '<div style="font-size:28px;">🗝️</div>' +
            '<div>' +
                '<h2 style="color:#ff0000;font-size:18px;margin:0;">GotFucked Decryptor v2.0</h2>' +
                '<div style="color:#888;font-size:11px;">by Bitcoin Motherfuckers Inc. | Terms & Conditions</div>' +
            '</div>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:20px 24px;">' +
            '<div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin-bottom:16px;">' +
                '<h3 style="color:#ff4444;margin-bottom:10px;font-size:14px;"> END USER LICENSE AGREEMENT</h3>' +
                '<div style="color:#aaa;font-size:12px;line-height:1.7;">' +
                    '<p style="margin-bottom:10px;"><strong>1. ACCEPTANCE OF TERMS</strong><br>By using this software, you acknowledge that your system has been infected with GotFucked Ransomware v2.0 and you accept all terms below.</p>' +
                    '<p style="margin-bottom:10px;"><strong>2. NO GUARANTEE</strong><br>This decryptor tool is provided "AS IS" without any warranty. We do not guarantee that all files will be recovered. Some files may be permanently lost.</p>' +
                    '<p style="margin-bottom:10px;"><strong>3. PAYMENT NOT REFUNDABLE</strong><br>If you have already paid the ransom, this tool will NOT refund your money. Payment is final and non-refundable.</p>' +
                    '<p style="margin-bottom:10px;"><strong>4. DATA COLLECTION</strong><br>This tool may collect system information, file metadata, and network data for "improvement purposes". By accepting, you consent to this collection.</p>' +
                    '<p style="margin-bottom:10px;"><strong>5. LIABILITY WAIVER</strong><br>Bitcoin Motherfuckers Inc. is not responsible for any data loss, system damage, or emotional distress caused by the ransomware or this decryptor.</p>' +
                    '<p style="margin-bottom:10px;"><strong>6. CORE FILE REMOVAL</strong><br>This decryptor only unlocks files. The ransomware CORE FILE (gotfucked.sys) must be manually removed via Command Prompt using: <code style="background:#222;padding:2px 6px;border-radius:3px;color:#00ff00;">del gotfucked.sys</code></p>' +
                    '<p style="margin-bottom:10px;"><strong>7. NO LEGAL RECOURSE</strong><br>By using this software, you waive all rights to pursue legal action against the creators, distributors, or affiliates of GotFucked Ransomware.</p>' +
                    '<p><strong>8. BINDING AGREEMENT</strong><br>This agreement is legally binding. Scroll down and check the box to accept all terms before decryption can proceed.</p>' +
                '</div>' +
            '</div>' +
            '<div style="background:#1a1a00;border:1px solid #ffcc00;border-radius:8px;padding:12px 16px;margin-bottom:16px;">' +
                '<div style="color:#ffcc00;font-size:12px;font-weight:bold;margin-bottom:6px;"> IMPORTANT NOTICE</div>' +
                '<div style="color:#aaa;font-size:11px;line-height:1.5;">After decryption, you MUST open Command Prompt and delete the core ransomware file. Failure to do so will result in re-infection on next boot.</div>' +
            '</div>' +
        '</div>' +
        '<div style="border-top:1px solid #333;padding:16px 24px;background:#111;">' +
            '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:12px;">' +
                '<input type="checkbox" id="' + winId + '-terms-check" onchange="document.getElementById(\'' + winId + '-decrypt-btn\').disabled=!this.checked;document.getElementById(\'' + winId + '-decrypt-btn\').style.opacity=this.checked?1:0.4;document.getElementById(\'' + winId + '-decrypt-btn\').style.cursor=this.checked?\'pointer\':\'default\';" style="width:16px;height:16px;accent-color:#ff0000;">' +
                '<span style="color:#ccc;font-size:12px;">I have read and accept all Terms & Conditions above</span>' +
            '</label>' +
            '<button id="' + winId + '-decrypt-btn" disabled onclick="runDecryptorProcess(\'' + winId + '\')" style="width:100%;padding:12px;background:#ff0000;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:bold;opacity:0.4;cursor:default;transition:opacity 0.2s;">DECRYPT ALL FILES</button>' +
        '</div>' +
    '</div>';
}

function runDecryptorProcess(winId) {
    const container = document.getElementById(winId + '-decryptor-container');
    if (!container) return;
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;">' +
        '<div style="font-size:64px;margin-bottom:20px;"></div>' +
        '<h2 style="color:#00ff00;margin-bottom:8px;">Decrypting Files...</h2>' +
        '<p style="color:#888;font-size:13px;margin-bottom:24px;">Please do not close this window</p>' +
        '<div style="width:100%;max-width:400px;background:#222;border-radius:10px;overflow:hidden;height:20px;margin-bottom:12px;">' +
            '<div id="' + winId + '-dec-progress" style="background:linear-gradient(to right,#00cc00,#00ff00);height:100%;width:0%;border-radius:10px;transition:width 0.3s;"></div>' +
        '</div>' +
        '<div id="' + winId + '-dec-percent" style="color:#00ff00;font-size:14px;font-weight:bold;">0%</div>' +
        '<div id="' + winId + '-dec-status" style="color:#666;font-size:11px;margin-top:8px;">Initializing decryption engine...</div>' +
    '</div>';

    let progress = 0;
    const stages = [
        { at: 0, text: 'Initializing decryption engine...' },
        { at: 10, text: 'Scanning locked files...' },
        { at: 25, text: 'Decrypting desktop icons...' },
        { at: 40, text: 'Restoring file access permissions...' },
        { at: 55, text: 'Unlocking applications...' },
        { at: 70, text: 'Restoring folder structures...' },
        { at: 85, text: 'Verifying decrypted files...' },
        { at: 95, text: 'Cleaning up temporary data...' },
        { at: 100, text: 'Decryption complete!' },
    ];

    const interval = setInterval(function() {
        progress += Math.random() * 2.5 + 0.5;
        if (progress > 100) progress = 100;
        const bar = document.getElementById(winId + '-dec-progress');
        const pct = document.getElementById(winId + '-dec-percent');
        const status = document.getElementById(winId + '-dec-status');
        if (bar) bar.style.width = Math.floor(progress) + '%';
        if (pct) pct.textContent = Math.floor(progress) + '%';
        for (let i = stages.length - 1; i >= 0; i--) {
            if (progress >= stages[i].at && status) { status.textContent = stages[i].text; break; }
        }
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(function() {
                if (typeof runGotFuckedDecryptor === 'function') runGotFuckedDecryptor();
                showDecryptorComplete(container, winId);
            }, 600);
        }
    }, 150);
}

function showDecryptorComplete(container, winId) {
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">' +
        '<div style="font-size:64px;margin-bottom:16px;">✅</div>' +
        '<h2 style="color:#00ff00;margin-bottom:8px;">Decryption Complete!</h2>' +
        '<p style="color:#888;font-size:13px;margin-bottom:20px;">All files, apps, and folders have been unlocked.</p>' +
        '<div style="background:#1a1a00;border:1px solid #ffcc00;border-radius:8px;padding:16px;max-width:400px;margin-bottom:20px;">' +
            '<div style="color:#ffcc00;font-size:13px;font-weight:bold;margin-bottom:8px;">⚠️ FINAL STEP REQUIRED</div>' +
            '<div style="color:#aaa;font-size:12px;line-height:1.6;">The ransomware <strong style="color:#ff4444;">CORE FILE</strong> still exists on your system. You must manually delete it:</div>' +
            '<div style="background:#000;border:1px solid #333;border-radius:4px;padding:10px;margin-top:10px;font-family:monospace;font-size:13px;color:#00ff00;">' +
                '1. Open <strong style="color:#fff;">Command Prompt</strong><br>' +
                '2. Type: <strong style="color:#fff;">del gotfucked.sys</strong><br>' +
                '3. Press Enter' +
            '</div>' +
        '</div>' +
        '<p style="color:#666;font-size:11px;">Failure to delete the core file will result in re-infection on next boot.</p>' +
    '</div>';
}
