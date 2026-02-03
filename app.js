// 应用状态管理
let appState = {
currentMode: null, // ‘practice’, ‘exam’, ‘wrong’
currentQuestionIndex: 0,
questions: [],
userAnswers: [],
score: 0,
timer: null,
timeRemaining: 0,
startTime: null
};

// 本地存储键名
const STORAGE_KEYS = {
WRONG_ANSWERS: ‘jp_driver_wrong_answers’,
STATS: ‘jp_driver_stats’,
PRACTICE_HISTORY: ‘jp_driver_practice_history’
};

// ===== 初始化 =====
document.addEventListener(‘DOMContentLoaded’, () => {
// 隐藏加载屏幕
setTimeout(() => {
document.getElementById(‘loading-screen’).classList.add(‘hidden’);
}, 1000);

```
// 加载统计数据
loadStats();
updateHomeStats();
```

});

// ===== 模式选择 =====
function startMode(mode) {
appState.currentMode = mode;

```
if (mode === 'practice') {
    startPracticeMode();
} else if (mode === 'exam') {
    startExamMode();
} else if (mode === 'wrong') {
    startWrongMode();
}
```

}

function startPracticeMode() {
// 随机选择50题
appState.questions = getRandomQuestions(50);
appState.currentQuestionIndex = 0;
appState.userAnswers = [];
appState.score = 0;
appState.startTime = Date.now();

```
showScreen('quiz-screen');
showQuestion();
```

}

function startExamMode() {
// 随机选择50题用于考试
appState.questions = getRandomQuestions(50);
appState.currentQuestionIndex = 0;
appState.userAnswers = [];
appState.score = 0;
appState.timeRemaining = 45 * 60; // 45分钟
appState.startTime = Date.now();

```
showScreen('quiz-screen');
startTimer();
showQuestion();
```

}

function startWrongMode() {
const wrongAnswers = getWrongAnswers();

```
if (wrongAnswers.length === 0) {
    alert('错题本是空的！继续努力练习吧！');
    return;
}

// 从错题本中获取题目
appState.questions = wrongAnswers.map(id => 
    questionBank.find(q => q.id === id)
).filter(q => q !== undefined);

appState.currentQuestionIndex = 0;
appState.userAnswers = [];
appState.score = 0;
appState.startTime = Date.now();

showScreen('quiz-screen');
showQuestion();
```

}

// ===== 题目显示 =====
function showQuestion() {
const question = appState.questions[appState.currentQuestionIndex];
if (!question) return;

```
// 更新进度
document.getElementById('question-counter').textContent = 
    `${appState.currentQuestionIndex + 1}/${appState.questions.length}`;

const progressPercent = ((appState.currentQuestionIndex + 1) / appState.questions.length) * 100;
document.getElementById('progress-bar').style.width = progressPercent + '%';

// 显示题目
document.getElementById('question-text').textContent = question.question;

// 显示图片（如果有）
const imageContainer = document.getElementById('question-image');
if (question.image) {
    imageContainer.innerHTML = `<img src="${question.image}" alt="题目图片">`;
    imageContainer.classList.add('active');
} else {
    imageContainer.classList.remove('active');
    imageContainer.innerHTML = '';
}

// 显示选项
const optionsContainer = document.getElementById('options-container');
optionsContainer.innerHTML = '';

question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option;
    button.onclick = () => selectAnswer(index);
    optionsContainer.appendChild(button);
});

// 隐藏反馈
document.getElementById('feedback-section').classList.remove('active');
```

}

// ===== 答案选择 =====
function selectAnswer(selectedIndex) {
const question = appState.questions[appState.currentQuestionIndex];
const isCorrect = selectedIndex === question.correct;

```
// 禁用所有选项
const options = document.querySelectorAll('.option-btn');
options.forEach((btn, index) => {
    btn.classList.add('disabled');
    if (index === question.correct) {
        btn.classList.add('correct');
    } else if (index === selectedIndex && !isCorrect) {
        btn.classList.add('wrong');
    }
});

// 记录答案
appState.userAnswers.push({
    questionId: question.id,
    selected: selectedIndex,
    correct: question.correct,
    isCorrect: isCorrect
});

if (isCorrect) {
    appState.score++;
} else {
    // 添加到错题本
    addToWrongAnswers(question.id);
}

// 显示反馈
showFeedback(isCorrect, question);
```

}

function showFeedback(isCorrect, question) {
const feedbackSection = document.getElementById(‘feedback-section’);
const feedbackResult = document.getElementById(‘feedback-result’);
const feedbackExplanation = document.getElementById(‘feedback-explanation’);

```
if (isCorrect) {
    feedbackResult.className = 'feedback-result correct';
    feedbackResult.innerHTML = '✓ 回答正确！';
} else {
    feedbackResult.className = 'feedback-result wrong';
    feedbackResult.innerHTML = '✗ 回答错误';
}

feedbackExplanation.innerHTML = `
    <strong>正确答案：</strong>${question.options[question.correct]}<br>
    <strong>解析：</strong>${question.explanation}
`;

feedbackSection.classList.add('active');
```

}

// ===== 下一题 =====
function nextQuestion() {
appState.currentQuestionIndex++;

```
if (appState.currentQuestionIndex >= appState.questions.length) {
    // 测验结束
    showResults();
} else {
    showQuestion();
}
```

}

// ===== 结果显示 =====
function showResults() {
// 停止计时器
if (appState.timer) {
clearInterval(appState.timer);
}

```
showScreen('result-screen');

const correctCount = appState.score;
const totalCount = appState.questions.length;
const percentage = Math.round((correctCount / totalCount) * 100);

// 判断是否通过（考试模式需要90%）
const isPassed = appState.currentMode === 'exam' ? percentage >= 90 : percentage >= 60;

// 更新结果图标和标题
const resultIcon = document.getElementById('result-icon');
const resultTitle = document.getElementById('result-title');

if (isPassed) {
    resultIcon.textContent = '🎉';
    resultTitle.textContent = appState.currentMode === 'exam' ? '恭喜通过考试！' : '成绩优秀！';
} else {
    resultIcon.textContent = '😢';
    resultTitle.textContent = appState.currentMode === 'exam' ? '未通过考试' : '继续加油！';
}

// 更新分数
document.getElementById('score-number').textContent = percentage + '%';
document.getElementById('score-label').textContent = '正确率';

// 更新详情
document.getElementById('correct-count').textContent = correctCount;
document.getElementById('wrong-count-result').textContent = totalCount - correctCount;
document.getElementById('total-count').textContent = totalCount;

// 动画显示分数圆圈
setTimeout(() => {
    const circle = document.getElementById('score-circle');
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}, 100);

// 保存统计数据
saveStats(correctCount, totalCount);
```

}

// ===== 计时器 =====
function startTimer() {
const timerDisplay = document.getElementById(‘timer’);
timerDisplay.style.display = ‘block’;

```
appState.timer = setInterval(() => {
    appState.timeRemaining--;
    
    const minutes = Math.floor(appState.timeRemaining / 60);
    const seconds = appState.timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // 最后5分钟变红色
    if (appState.timeRemaining <= 300) {
        timerDisplay.style.color = '#ef4444';
    }
    
    // 时间到
    if (appState.timeRemaining <= 0) {
        clearInterval(appState.timer);
        showResults();
    }
}, 1000);
```

}

// ===== 屏幕切换 =====
function showScreen(screenId) {
document.querySelectorAll(’.screen’).forEach(screen => {
screen.classList.remove(‘active’);
});
document.getElementById(screenId).classList.add(‘active’);
}

// ===== 导航 =====
function exitQuiz() {
if (confirm(‘确定要退出吗？当前进度将丢失。’)) {
if (appState.timer) {
clearInterval(appState.timer);
}
goHome();
}
}

function goHome() {
showScreen(‘home-screen’);
updateHomeStats();
appState = {
currentMode: null,
currentQuestionIndex: 0,
questions: [],
userAnswers: [],
score: 0,
timer: null,
timeRemaining: 0,
startTime: null
};
}

function retryQuiz() {
if (appState.currentMode === ‘practice’) {
startPracticeMode();
} else if (appState.currentMode === ‘exam’) {
startExamMode();
} else if (appState.currentMode === ‘wrong’) {
startWrongMode();
}
}

function reviewWrong() {
startWrongMode();
}

// ===== 设置 =====
function showSettings() {
showScreen(‘settings-screen’);
}

function hideSettings() {
showScreen(‘home-screen’);
}

function clearWrongAnswers() {
if (confirm(‘确定要清空错题本吗？’)) {
localStorage.removeItem(STORAGE_KEYS.WRONG_ANSWERS);
alert(‘错题本已清空’);
updateHomeStats();
}
}

function clearAllData() {
if (confirm(‘确定要重置所有数据吗？此操作不可恢复！’)) {
localStorage.clear();
alert(‘所有数据已重置’);
updateHomeStats();
}
}

// ===== 数据管理 =====
function getRandomQuestions(count) {
const shuffled = […questionBank].sort(() => Math.random() - 0.5);
return shuffled.slice(0, Math.min(count, shuffled.length));
}

function addToWrongAnswers(questionId) {
let wrongAnswers = getWrongAnswers();
if (!wrongAnswers.includes(questionId)) {
wrongAnswers.push(questionId);
localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(wrongAnswers));
}
}

function getWrongAnswers() {
const data = localStorage.getItem(STORAGE_KEYS.WRONG_ANSWERS);
return data ? JSON.parse(data) : [];
}

function saveStats(correct, total) {
let stats = loadStats();
stats.totalQuestions += total;
stats.totalCorrect += correct;
stats.totalSessions++;
stats.lastPlayed = Date.now();

```
localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
```

}

function loadStats() {
const data = localStorage.getItem(STORAGE_KEYS.STATS);
return data ? JSON.parse(data) : {
totalQuestions: 0,
totalCorrect: 0,
totalSessions: 0,
lastPlayed: null
};
}

function updateHomeStats() {
const stats = loadStats();
const wrongAnswers = getWrongAnswers();

```
document.getElementById('total-practiced').textContent = stats.totalQuestions;

const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;
document.getElementById('total-correct').textContent = accuracy + '%';

document.getElementById('wrong-count').textContent = wrongAnswers.length;

// 更新错题模式描述
const wrongModeBtn = document.getElementById('wrong-mode-btn');
const wrongModeDesc = document.getElementById('wrong-mode-desc');
if (wrongAnswers.length === 0) {
    wrongModeBtn.style.opacity = '0.5';
    wrongModeDesc.textContent = '暂无错题';
} else {
    wrongModeBtn.style.opacity = '1';
    wrongModeDesc.textContent = `${wrongAnswers.length}道错题待复习`;
}
```

}

// ===== 工具函数 =====
function shuffleArray(array) {
const newArray = […array];
for (let i = newArray.length - 1; i > 0; i–) {
const j = Math.floor(Math.random() * (i + 1));
[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
}
return newArray;
}