const userAnswers = [];

const TRIVIA_API_URL =
  "https://opentdb.com/api.php?amount=10&category=18&difficulty=medium&type=multiple";
const PANTRY_API_URL = "https://pantry-proxy-api-two.vercel.app/test";

const quizContainer = document.querySelector(".quiz-container");
const quizBox = document.getElementById("quiz-box");
const questionNumber = document.getElementById("question-number");
const questionText = document.getElementById("question-text");
const timerDisplay = document.getElementById("time-left");
const choiceContainer = document.getElementById("choice-container");
const nextButton = document.getElementById("next-btn");
const prevButton = document.getElementById("previous-btn");
const loader = document.getElementById("loader");
const highScoremodal = document.getElementById("high-score-modal");
const highScoreslist = document.getElementById("list-high-score");
const playAgainBtn = document.getElementById("play-again-btn");
const submitBtn = document.getElementById("submit-btn");

let highScores = [];
let currentQuestion = 0;
let Questions = [];
const TOTAL_TIME = 60000; // 1 minute in ms
let timeLeft = TOTAL_TIME;
let timerInterval = null;
let baseTimeLeft = TOTAL_TIME;

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

    choices.forEach((choice) => {
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

  if (currentQuestion === 9) {
    submitBtn.classList.remove("hidden");
  }
};

function endQuiz() {
  alert("⏰ Time's up!");

  // disable everything
  document.querySelectorAll(".choice").forEach((btn) => (btn.disabled = true));
  nextButton.disabled = true;
  prevButton.disabled = true;

  // you can show score / modal here
  // showResult();
}

function pauseTimer() {
  if (!timerInterval) return;

  clearInterval(timerInterval);
  timerInterval = null;
}

function startTimer() {
  if (timerInterval) return;

  const startTime = Date.now();
  const baseTimeLeft = timeLeft; // 🔑 snapshot ONCE

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = baseTimeLeft - elapsed;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeLeft = 0;
      updateTimerDisplay(0);
      endQuiz();
      return;
    }

    timeLeft = remaining; // ✅ safe now
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

const loadingFunc = () => {
  quizBox.classList.add("hidden");
  loader.classList.remove("hidden");
  loader.offsetHeight;
};

// End game when all the questions are finished

const CalcScore = () => {
  let Score = 0;

  Questions.forEach((question, index) => {
    if (userAnswers[index] === question.correct_answer.trim()) {
      Score += 100;
    }
  });

  const TimeBonus = Math.floor(timeLeft / 1000);
  Score += TimeBonus;
  return Score;
};

const endGame = () => {
  loader.classList.add("hidden"); // hide loader
  saveHighScore();
};

const saveHighScore = async () => {
  const total_score = CalcScore();
  let name = prompt("Enter your name for score board");
  name = name?.trim() || "Anonymous";
  const date = new Date().toLocaleDateString();
  const newScore = { name, score: total_score, date };
  console.log(newScore);

  try {
    const response = await fetch(PANTRY_API_URL);
    if (response.ok) {
      const data = await response.json();
      highScores = data.highScores || [];
    }
  } catch (error) {
    console.log("Basket not found ,creating a new one");
    highScores = [];
  }
  highScores.push(newScore);

  // Sort high scores and keep only top 10
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 10);

  try {
    await fetch(PANTRY_API_URL, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ highScores }),
    });
  } catch (error) {
    console.error("Error saving high score:", error);
  }

  displayHighScore(newScore);
};

// Display high Score

const displayHighScore = (newScore) => {
  highScoreslist.innerHTML = "";

  highScores.forEach((score) => {
    const newrow = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.innerText = score.name;

    const scoreCell = document.createElement("td");
    scoreCell.innerText = score.score;

    const dateCell = document.createElement("td");
    dateCell.innerText = score.date;

    newrow.appendChild(nameCell);
    newrow.appendChild(scoreCell);
    newrow.appendChild(dateCell);

    if (
      score.name === newScore.name &&
      score.score === newScore.score &&
      score.date === newScore.date
    ) {
      newrow.classList.add("highlight");
    }

    highScoreslist.appendChild(newrow);
  });

  highScoremodal.style.display = "flex";
};
// Submit button logic

submitBtn.addEventListener("click", () => {
  pauseTimer(); //  STOP TIME
  loadingFunc();
  setTimeout(() => {
    endGame();
  }, 2000);
});

playAgainBtn.addEventListener("click", () => {
  window.location.reload();
});

fetchQuestions();
