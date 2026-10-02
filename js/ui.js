const UI = {
    container: document.getElementById('app-container'),
    backBtn: document.getElementById('back-btn'),
    appTitle: document.getElementById('app-title'),
    translateBtn: document.getElementById('floating-translate-btn'),
    currentLecture: null,
    isRTL: false,
    activeSection: null,

    init() {
        this.initTheme();
        this.isRTL = false;
        document.body.classList.remove('rtl-mode');
    },

    parseKeywords(text) {
        if (!text) return '';
        let colorIndex = 0;
        return text.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
            const span = `<span class="highlight-keyword color-${colorIndex % 5}">${p1}</span>`;
            colorIndex++;
            return span;
        });
    },

    hideAllOverlays() {
        document.getElementById('win-overlay').style.display = 'none';
    },

    showWelcomeModal() {
        document.getElementById('welcome-overlay').style.display = 'flex';
    },

    closeWelcomeModal() {
        document.getElementById('welcome-overlay').style.display = 'none';
        localStorage.setItem('analyticalAppVisited_v2', 'true');
    },

    openSidebar() {
        document.getElementById('sidebar-overlay').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('sidebar').classList.add('open');
        }, 10);
    },

    closeSidebar(e) {
        if (e && e.target.id !== 'sidebar-overlay') return;
        document.getElementById('sidebar').classList.remove('open');
        setTimeout(() => {
            document.getElementById('sidebar-overlay').style.display = 'none';
        }, 300);
    },

    showPrivacy() {
        this.closeSidebar();
        setTimeout(() => {
            document.getElementById('privacy-overlay').style.display = 'flex';
        }, 300);
    },

    toggleTranslation() {
        this.isRTL = !this.isRTL;
        const textSpan = document.getElementById('translate-text');

        if (this.isRTL) {
            document.body.classList.add('rtl-mode');
            if (textSpan) textSpan.innerText = "English ← Arabic";
        } else {
            document.body.classList.remove('rtl-mode');
            if (textSpan) textSpan.innerText = "English → Arabic";
        }

        if (this.activeSection === 'summary') {
            this.openSection('summary');
        } else if (this.activeSection === 'quiz') {
            if (typeof QuizController !== 'undefined' && QuizController.currentRoundQuestions.length > 0) {
                QuizController.loadQuestion();
            } else {
                this.openSection('quiz');
            }
        }
    },

    renderHome() {
        this.init();
        this.backBtn.classList.add('hidden');
        document.getElementById('menu-btn').classList.remove('hidden');
        this.translateBtn.classList.add('hidden');
        this.appTitle.innerText = "Analytical Master";

        let html = `<div class="screen"><div class="lecture-grid">`;

        DataStore.lectures.forEach(lecture => {
            const isCompleted = DataStore.userProgress.completedLectures.includes(lecture.id);
            const statusText = isCompleted ? "COMPLETED" : "NOT STARTED";
            const progressWidth = isCompleted ? "100%" : "0%";

            const lockedClass = lecture.isPlaceholder ? "locked" : "";
            const onClickAttr = lecture.isPlaceholder ?
                `onclick="alert('Content to be added soon!')"` :
                `onclick="App.openLecture(${lecture.id})"`;

            html += `
                <div class="lecture-card ${lockedClass}" ${onClickAttr}>
                    <div class="lecture-title">${lecture.title}</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 700;">${statusText}</div>
                    <div class="main-progress-bg">
                        <div class="main-progress-fill" style="width: ${progressWidth};"></div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
        this.container.innerHTML = html;
    },

    renderLecture(lecture) {
        document.getElementById('app-container').scrollTop = 0;
        this.currentLecture = lecture;

        document.getElementById('menu-btn').classList.add('hidden');
        this.backBtn.classList.remove('hidden');
        this.translateBtn.classList.add('hidden');
        this.appTitle.innerText = `Lec ${lecture.id}`;
        this.backBtn.onclick = () => this.renderHome();

        let gridHtml = `<div class="screen" id="lecture-menu"><div class="section-grid">`;
        if (lecture.summary) gridHtml += this.createSectionCard('summary', 'Summary', 'ملخص شامل لجميع أجزاء المحاضرة');
        if (lecture.terms && lecture.terms.length > 0) gridHtml += this.createSectionCard('terms', 'Scientific Terms', 'جميع المصطلحات العلمية والتعريفات');
        if (lecture.reasons && lecture.reasons.length > 0) gridHtml += this.createSectionCard('reasons', 'Give Reason', 'أهم أسئلة Give Reason');
        if (lecture.qna && lecture.qna.length > 0) gridHtml += this.createSectionCard('qna', 'Q&A', 'إجابات ونماذج أسئلة المحاضرة');
        if (lecture.quiz && lecture.quiz.length > 0) gridHtml += this.createSectionCard('quiz', 'QUIZ', 'اختبر نفسك بأسئلة تفاعلية');

        gridHtml += `</div></div><div id="section-content"></div>`;
        this.container.innerHTML = gridHtml;
    },
    createSectionCard(id, title, desc) {
        return `
            <div class="section-card" onclick="UI.openSection('${id}')">
                <div class="section-title" style="font-family: 'Cairo', sans-serif;">${title}</div>
                <div class="section-desc" style="font-family: 'Cairo', sans-serif;">${desc}</div>
            </div>
        `;
    },

    openSection(sectionId) {
        document.getElementById('app-container').scrollTop = 0;
        this.activeSection = sectionId;
        document.getElementById('lecture-menu').style.display = 'none';
        const contentDiv = document.getElementById('section-content');
        contentDiv.style.display = 'block';

        if (sectionId === 'summary') {
            this.translateBtn.classList.remove('hidden');
        } else {
            this.translateBtn.classList.add('hidden');
        }

        this.backBtn.onclick = () => {
            this.init();
            contentDiv.style.display = 'none';
            document.getElementById('lecture-menu').style.display = 'block';
            this.translateBtn.classList.add('hidden');
            this.backBtn.onclick = () => this.renderHome();
        };

        const lec = this.currentLecture;
        let contentHtml = ``;

        if (sectionId === 'summary') {
            let summaryData = (this.isRTL && lec.summaryAr && lec.summaryAr.length > 0) ? lec.summaryAr : lec.summary;
            let html = '';

            const icons = {
                note: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
                law: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
                example: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
                warning: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
                def: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
                steps: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
                vip: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
                tip: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
                insight: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19.2c-2.05 2.06-5.4 2.1-7.5.08L4.3 13.6c-2.06-2.04-2.1-5.4-.08-7.46.06-.06.13-.12.2-.18a5.52 5.52 0 0 1 7.6 0l.27.27.26-.27a5.52 5.52 0 0 1 7.6 0c.06.06.13.12.18.2 2.06 2.05 2.1 5.4.08 7.46l-2.9 2.94Z"/><path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`
            };

            if (Array.isArray(summaryData)) {
                summaryData.forEach(block => {
                    let txt = block.content ? this.parseKeywords(block.content.replace(/\n/g, '<br>')) : '';

                    if (block.type === 'note') {
                        html += `<div class="orange-note-box"><div class="box-header">${icons.note} <span>${block.title}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'law') {
                        html += `<div class="law-box"><div class="box-header">${icons.law} <span>${block.title}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'equation') {
                        html += `<div class="eq-box">${txt}</div>`;
                    } else if (block.type === 'example') {
                        html += `<div class="example-box"><div class="box-header">${icons.example} <span>${block.title}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'warning') {
                        html += `<div class="warning-box"><div class="box-header">${icons.warning} <span>${block.title}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'definition') {
                        html += `<div class="def-box"><div class="box-header">${icons.def} <span>${block.term}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'vip') {
                        html += `<div class="vip-box"><div class="box-header">${icons.vip} <span>${block.title || 'VIP Exam Focus'}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'tip') {
                        html += `<div class="tip-box"><div class="box-header">${icons.tip} <span>${block.title || 'Quick Tip'}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'steps') {
                        let stepsHtml = block.items.map(s => `<li>${this.parseKeywords(s.replace(/\n/g, '<br>'))}</li>`).join('');
                        html += `<div class="steps-box"><div class="box-header">${icons.steps} <span>${block.title}</span></div><ol class="steps-list">${stepsHtml}</ol></div>`;
                    } else if (block.type === 'mindmap') {
                        let branchesHtml = block.branches.map(b => `<div class="mindmap-leaf">${this.parseKeywords(b)}</div>`).join('');
                        html += `<div class="mindmap-container"><div class="mindmap-center">${block.center}</div><div class="mindmap-branches">${branchesHtml}</div></div>`;
                    } else if (block.type === 'table') {
                        let headersHtml = block.headers.map(h => `<th>${h}</th>`).join('');
                        let rowsHtml = block.rows.map(r => `<tr>${r.map(d => `<td>${this.parseKeywords(d.replace(/\n/g, '<br>'))}</td>`).join('')}</tr>`).join('');
                        html += `<div class="summary-table-wrapper"><table class="summary-table"><thead><tr>${headersHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
                    } else if (block.type === 'list') {
                        let itemsHtml = block.items.map(i => `<li>${this.parseKeywords(i.replace(/\n/g, '<br>'))}</li>`).join('');
                        html += `<ul style="margin: 0 0 15px 20px;">${itemsHtml}</ul>`;
                    } else if (block.type === 'title') {
                        html += `<h3 style="color:var(--secondary-blue-dark); margin: 25px 0 10px; font-weight:800;">${txt}</h3>`;
                    } else if (block.type === 'insight') {
                        html += `<div class="insight-box"><div class="box-header">${icons.insight} <span>${block.title || 'فهم عميق'}</span></div><p>${txt}</p></div>`;
                    } else if (block.type === 'text') {
                        html += `<p style="margin-bottom:12px;">${txt}</p>`;
                    }
                });
                contentHtml = `<div class="screen summary-wrapper english-content">${html}</div>`;
            }
        } else if (sectionId === 'terms') {
            contentHtml = `<div class="screen english-content">` + lec.terms.map(t => `<div class="term-card"><h3>${this.parseKeywords(t.term)}</h3><p>${this.parseKeywords(t.definition)}</p></div>`).join('') + `</div>`;
        } else if (sectionId === 'reasons') {
            contentHtml = `<div class="screen english-content">` + lec.reasons.map(r => `<div class="reason-card"><div class="q-box"><div>${this.parseKeywords(r.q)}</div></div><div class="a-box"><div>${this.parseKeywords(r.a)}</div></div></div>`).join('') + `</div>`;
        } else if (sectionId === 'qna') {
            contentHtml = `<div class="screen english-content">` + lec.qna.map(q => `<div class="qna-card"><div class="q-box"><div>${this.parseKeywords(q.q)}</div></div><div class="a-box"><div>${this.parseKeywords(q.a)}</div></div></div>`).join('') + `</div>`;
        } else if (sectionId === 'quiz') {
            contentHtml = `
                <div class="screen" style="text-align:center; padding-top: 60px;">
                    <h2 style="margin-bottom: 25px; font-family: 'Cairo', sans-serif;">جاهز لاختبار فهمك؟</h2>
                    <button class="btn-main" style="width: 80%; max-width: 320px;" onclick="QuizController.openSettings(${lec.id})">ابدأ الاختبار الآن</button>
                </div>
            `;
            this.backBtn.classList.remove('hidden');
        }

        contentDiv.innerHTML = contentHtml;

        if (window.renderMathInElement) {
            renderMathInElement(contentDiv, {
                delimiters: [{
                        left: "$$",
                        right: "$$",
                        display: true
                    },
                    {
                        left: "$",
                        right: "$",
                        display: false
                    }
                ],
                throwOnError: false
            });
        }
    },

    renderQuizQuestion(qData, currentIndex, totalNum, roundNum) {
        document.body.classList.add('quiz-active');
        this.activeSection = 'quiz';
        const contentDiv = document.getElementById('section-content');
        const progressPercent = ((currentIndex + 1) / totalNum) * 100;
        const isAnswered = qData.userAnswerIndex !== null;

        this.translateBtn.classList.remove('hidden');

        let qText = (this.isRTL && qData.questionAr) ? qData.questionAr : qData.question;
        qText = this.parseKeywords(qText);
        let qOptions = (this.isRTL && qData.optionsAr && qData.optionsAr.length > 0) ? qData.optionsAr : qData.options;
        let qHint = (this.isRTL && qData.hintAr) ? qData.hintAr : qData.hint;

        let imageHtml = qData.image ? `<img src="${qData.image}" class="quiz-q-img" />` : '';
        let timerHtml = (QuizController.settings.timerVal > 0) ? `<div id="quiz-timer-display" class="quiz-timer">⏱️ ${QuizController.timeLeft || QuizController.settings.timerVal}s</div>` : '';

        let html = `
            <div class="quiz-wrapper">
                <div class="quiz-header">
                    <span class="close-btn" onclick="UI.exitQuiz()">
                        <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                    <div class="quiz-progress-bar-bg">
                        <div class="quiz-progress-bar-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    ${timerHtml}
                    <div style="font-weight: 900; font-size: 16px; margin-left:10px; color: var(--text-main); direction: ltr;">${currentIndex + 1}/${totalNum}</div>
                </div>
                
                ${QuizController.settings.retryWrong ? `<div id="round-info">Round ${roundNum}</div>` : ''}
                
                ${imageHtml}
                <div class="quiz-question-box">${qText.replace(/\n/g, '<br>')}</div>
                <div class="options-container">
        `;

        qData.shuffledIndices.forEach(originalIdx => {
            let stateClass = "active-click";
            let clickAction = `onclick="QuizController.selectOption(this, ${originalIdx})"`;

            if (isAnswered) {
                clickAction = "";
                stateClass = "locked";
                if (originalIdx === qData.correct) stateClass += " correct";
                else if (originalIdx === qData.userAnswerIndex) stateClass += " wrong";
            }
            let optText = this.parseKeywords(qOptions[originalIdx].replace(/\n/g, '<br>'));
            html += `<div class="option-btn ${stateClass}" ${clickAction}>${optText}</div>`;
        });
        html += `</div>`;

        if (isAnswered && qHint) {
            html += `
                <div class="quiz-hint-box">
                    <div class="hint-header">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                        <span>${this.isRTL ? "لماذا هذه الإجابة صحيحة؟" : "Why is this correct?"}</span>
                    </div>
                    <div class="hint-content">${qHint.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }

        const backDisabled = currentIndex === 0 ? "disabled" : "";
        const nextDisabled = !isAnswered ? "disabled" : "";
        const nextText = (currentIndex === totalNum - 1 && isAnswered) ? (this.isRTL ? "إنهاء" : "FINISH") : (this.isRTL ? "التالي" : "NEXT");

        html += `
                <div class="quiz-footer">
                    <button class="nav-btn next" ${nextDisabled} onclick="QuizController.nextQuestion()">${nextText}</button>
                    <button class="nav-btn prev" ${backDisabled} onclick="QuizController.prevQuestion()">${this.isRTL ? "الرجوع" : "BACK"}</button>
                </div>
            </div>
        `;
        contentDiv.innerHTML = html;

        if (window.renderMathInElement) {
            renderMathInElement(contentDiv, {
                delimiters: [{
                        left: "$$",
                        right: "$$",
                        display: true
                    },
                    {
                        left: "$",
                        right: "$",
                        display: false
                    }
                ],
                throwOnError: false
            });
        }
    },
    exitQuiz() {
        document.body.classList.remove('quiz-active');
        this.init();
        if (typeof QuizController !== 'undefined') QuizController.forceExit();
        document.getElementById('section-content').style.display = 'none';
        document.getElementById('lecture-menu').style.display = 'block';
        this.translateBtn.classList.add('hidden');
        this.backBtn.classList.remove('hidden');
        this.backBtn.onclick = () => this.renderHome();
    },

    showWinOverlay() {
        document.body.classList.remove('quiz-active');
        this.translateBtn.classList.add('hidden');
        document.getElementById('win-overlay').style.display = 'flex';
        confetti({
            particleCount: 300,
            spread: 100,
            origin: {
                y: 0.6
            },
            colors: ['#12D11E', '#2196F3', '#FFC107']
        });
    },

    initTheme() {
        const savedTheme = localStorage.getItem('appTheme');
        const toggleInput = document.getElementById('dark-mode-toggle');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (toggleInput) toggleInput.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (toggleInput) toggleInput.checked = false;
        }
    },

    handleThemeToggle(isDark, save = true) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (save) localStorage.setItem('appTheme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            if (save) localStorage.setItem('appTheme', 'light');
        }
        const toggleInput = document.getElementById('dark-mode-toggle');
        if (toggleInput) toggleInput.checked = isDark;
    },

    showToast(message, actionText, actionCallback) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.innerHTML = `
            <div class="toast-text">${message}</div>
            <button class="toast-btn">${actionText}</button>
        `;

        toast.querySelector('.toast-btn').onclick = () => {
            actionCallback();
            toast.remove();
        };

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 8000);
    }
};