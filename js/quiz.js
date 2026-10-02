const QuizController = {
    currentRoundQuestions: [],
    currentIndex: 0,
    currentRound: 1,
    lectureId: null,

    settings: {
        shuffle: true,
        retryWrong: true,
        timerVal: 0
    },
    timerInterval: null,
    timeLeft: 0,

    openSettings(lectureId) {
        this.lectureId = lectureId;
        document.getElementById('quiz-settings-overlay').style.display = 'flex';
    },

    applySettingsAndStart() {
        this.settings.shuffle = document.getElementById('setting-shuffle').checked;
        this.settings.retryWrong = document.getElementById('setting-retry').checked;
        this.settings.timerVal = parseInt(document.getElementById('setting-timer').value);

        document.getElementById('quiz-settings-overlay').style.display = 'none';
        this.startQuiz();
    },

    startQuiz() {
        const lecture = DataStore.getLectureById(this.lectureId);
        let fullBank = JSON.parse(JSON.stringify(lecture.quiz));

        if (this.settings.shuffle) {
            fullBank = fullBank.sort(() => Math.random() - 0.5);
        }

        this.prepareRound(fullBank);
        this.currentRound = 1;
        this.loadQuestion();
    },

    prepareRound(questionsArray) {
        this.currentRoundQuestions = questionsArray.map(q => {
            let indices = Array.from(Array(q.options.length).keys());
            q.shuffledIndices = indices.sort(() => Math.random() - 0.5);
            q.userAnswerIndex = null;
            return q;
        });
        this.currentIndex = 0;
    },

    loadQuestion() {
        this.clearTimer();
        const qData = this.currentRoundQuestions[this.currentIndex];
        UI.renderQuizQuestion(qData, this.currentIndex, this.currentRoundQuestions.length, this.currentRound);

        if (this.settings.timerVal > 0 && qData.userAnswerIndex === null) {
            this.startTimer();
        }
    },

    startTimer() {
        this.timeLeft = this.settings.timerVal;
        this.updateTimerUI();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerUI();

            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.selectOption(null, -1);
            }
        }, 1000);
    },

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateTimerUI() {
        const timerDisplay = document.getElementById('quiz-timer-display');
        if (timerDisplay) {
            timerDisplay.innerHTML = `⏱️ ${this.timeLeft}s`;
            if (this.timeLeft <= 5) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning');
            }
        }
    },

    selectOption(selectedBtn, originalIdx) {
        this.clearTimer();
        const qData = this.currentRoundQuestions[this.currentIndex];
        qData.userAnswerIndex = originalIdx;
        UI.renderQuizQuestion(qData, this.currentIndex, this.currentRoundQuestions.length, this.currentRound);
    },

    nextQuestion() {
        if (this.currentIndex < this.currentRoundQuestions.length - 1) {
            this.currentIndex++;
            this.loadQuestion();
        } else {
            this.evaluateRoundEnd();
        }
    },

    prevQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadQuestion();
        }
    },

    evaluateRoundEnd() {
        let failedQuestions = this.currentRoundQuestions.filter(q => q.userAnswerIndex !== q.correct);

        if (failedQuestions.length > 0 && this.settings.retryWrong) {
            this.currentRound++;
            let cleanFailed = failedQuestions.map(q => {
                return {
                    question: q.question,
                    questionAr: q.questionAr,
                    image: q.image,
                    options: q.options,
                    optionsAr: q.optionsAr,
                    correct: q.correct,
                    hint: q.hint,
                    hintAr: q.hintAr
                };
            });
            if (this.settings.shuffle) {
                cleanFailed = cleanFailed.sort(() => Math.random() - 0.5);
            }
            this.prepareRound(cleanFailed);
            this.loadQuestion();
        } else {
            UI.showWinOverlay();
        }
    },

    forceExit() {
        this.clearTimer();
        this.currentRoundQuestions = [];
    }
};