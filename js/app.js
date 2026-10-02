let deferredPrompt
const App = {
    init() {
        this.loadProgress();
        UI.init();
        UI.renderHome();
        this.checkFirstVisit();
        this.initNotifications();
    },

    installPWA() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        }
    },

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('analyticalAppVisited_v2');
        if (!hasVisited) {
            UI.showWelcomeModal();
        }
    },

    openTelegramDev() {
        window.open(`https://t.me/mytepro`, '_blank');
    },

    openLink(type) {
        if (type === 'drive') {
            window.open(`https://drive.google.com/drive/folders/1SKFJNvijGL-owI3e8Z3DJgtwpc9Wupeh`, '_blank');
        } else if (type === 'bot') {
            window.open(`https://t.me/MrymYasser79bot`, '_blank');
        }
    },

    initNotifications() {
        setTimeout(() => {
            UI.showToast(
                "🎧 يوجد بوت تليجرام منظم فيه جميع ريكوردات الشرح",
                "فتح البوت",
                () => App.openLink('bot')
            );
        }, 15000);

        setTimeout(() => {
            UI.showToast(
                "📁 متوفر مجلد Drive يحتوي على جميع الـ PDFs والملفات الخاصة بجميع المواد!",
                "فتح المجلد",
                () => App.openLink('drive')
            );
        }, 25000);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker Registered'))
                .catch(err => console.log('Service Worker Failed', err));
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            setTimeout(() => {
                UI.showToast(
                    "📲 ثبّت تطبيق Analytical Master على موبايلك للوصول السريع والمذاكرة بدون إنترنت!",
                    "تثبيت الآن",
                    () => App.installPWA()
                );
            }, 8000);
        });

    },

    resetProgress() {
        if (confirm("هل أنت متأكد من مسح جميع تقدمك في المحاضرات؟")) {
            localStorage.removeItem('analyticalAppProgress');
            this.loadProgress();
            UI.closeSidebar();
            UI.renderHome();
        }
    },

    loadProgress() {
        const savedData = localStorage.getItem('analyticalAppProgress');
        if (savedData) {
            DataStore.userProgress = JSON.parse(savedData);
        } else {
            DataStore.userProgress = {
                completedLectures: []
            };
        }
    },

    saveProgress() {
        localStorage.setItem('analyticalAppProgress', JSON.stringify(DataStore.userProgress));
    },

    openLecture(id) {
        const lecture = DataStore.getLectureById(id);
        if (lecture && !lecture.isPlaceholder) {
            UI.renderLecture(lecture);
        }
    },

    completeLecture() {
        UI.hideAllOverlays();

        const currentLectureId = QuizController.lectureId;
        if (!DataStore.userProgress.completedLectures.includes(currentLectureId)) {
            DataStore.userProgress.completedLectures.push(currentLectureId);
            this.saveProgress();
        }

        document.getElementById('section-content').style.display = 'none';
        if (document.getElementById('lecture-menu')) {
            document.getElementById('lecture-menu').style.display = 'none';
        }
        UI.renderHome();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});