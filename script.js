const userAnswers = [];

const TRIVIA_API_URL =
  "https://opentdb.com/api.php?amount=10&category=18&difficulty=medium&type=multiple";
const PANTRY_API_URL = "https://pantry-proxy-api-two.vercel.app/test";

const quizBox = document.getElementById("quiz-box");
const questionNumber = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const timerDisplay = document.getElementById("time-left");
const choiceContainer = document.getElementById("choice-container");
const nextButton = document.getElementById("next-btn");
const prevButton = document.getElementById("previous-btn");
const loader = document.getElementById("loader");
const highScoreList = document.getElementById("high-score-modal");
const listhighScore = document.getElementById("list-high-score");
const playAgainBtn = document.getElementById("play-again-btn");

let currentQuestion = 0;
let score = 0;
let Questions = [];
let totalScore = 0;
const TOTAL_TIME = 60000; // 1 minute in ms
let timeLeft = TOTAL_TIME;
let timerInterval = null;

//Fetch Questions from API
async function fetchQuestions() {
  try {
    const response = await fetch(TRIVIA_API_URL);
    const data = await response.json();
    Questions = data.results;
    console.log(Questions);

    loadQuestions();
  } catch (error) {
    console.error("Error fetching questions:", error);
    questionText.innerText = "Failed to load questions";
  }
}

// Load each question to UI

const loadQuestions = () => {

  const question = Questions[currentQuestion];
  questionText.innerHTML = question.question;
  questionNumber.innerText = `Question ${currentQuestion + 1}`;
  // Reset choices
  choiceContainer.innerHTML = "";

  prevButton.disabled = currentQuestion === 0;
  nextButton.disabled = currentQuestion === Questions.length - 1;

  // Prepare choices

  const choices = [...question.incorrect_answers, question.correct_answer].sort(
    () => Math.random() - 0.5,
  );
  choices.forEach((choice) => {
    choice = choice.trim();
    const choiceBtn = document.createElement("button");
    choiceBtn.className = "choice w-full py-3 border rounded hover:bg-gray-100";
    choiceBtn.innerHTML = choice;
    choiceBtn.onclick = () =>
      checkAnswer(choiceBtn, question.correct_answer.trim());
    choiceContainer.appendChild(choiceBtn);
  });

  const previousAnswer = userAnswers[currentQuestion];

  if (previousAnswer) {
    const choices = document.querySelectorAll(".choice");

    choices.forEach(choice => {
      // remove hover override
      choice.classList.remove("hover:bg-gray-100");
      if (choice.innerHTML.trim() === question.correct_answer.trim()) {
        choice.classList.add("correct");
      }

      choice.disabled = true;
    });
  }

  if (currentQuestion === 0) {
    startTimer();
  }
};

function endQuiz() {
  alert("⏰ Time's up!");
  
  // disable everything
  document.querySelectorAll(".choice").forEach(btn => btn.disabled = true);
  nextButton.disabled = true;
  prevButton.disabled = true;

  // you can show score / modal here
  // showResult();
}


function startTimer() {
  if (timerInterval) return; // prevent multiple timers

  const startTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timeLeft = TOTAL_TIME - elapsed;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeLeft = 0;
      updateTimerDisplay(0);
      endQuiz();
      return;
    }

    updateTimerDisplay(timeLeft);
  }, 100);
}

function updateTimerDisplay(ms) {
  const seconds = (ms / 1000).toFixed(2);
  timerDisplay.innerText = `${seconds}`;
}

// Check Answer logic

const checkAnswer = (selectedAnswer, correctAnswer) => {
  const selectedText = selectedAnswer.innerHTML.trim();

  // save answer
  userAnswers[currentQuestion] = selectedText;
  const choices = document.querySelectorAll(".choice");
  choices.forEach((choice) => {
    // remove hover override
    choice.classList.remove("hover:bg-gray-100");
    if (choice.innerHTML.trim() === correctAnswer) {
      choice.classList.add("correct");
    } else {
      choice.classList.add("wrong");
    }
    choice.disabled = true;
  });

};

// Next Button logic

nextButton.addEventListener("click", () => {
  currentQuestion++;
  loadQuestions();
});

// previous button logic

prevButton.addEventListener("click", () => {
  currentQuestion--;
  loadQuestions();
});

fetchQuestions();
