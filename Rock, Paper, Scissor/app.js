'use strict';

const moves = ['rock', 'paper', 'scissors'];
const beats = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

const state = {
  mode: 'robot',
  difficulty: 'easy',
  scores: { p1: 0, p2: 0, tie: 0 },
  turn: 1,
  pendingChoice: null,
  history: [],
  view: 'home',
};

// View references
const views = {
  home: document.getElementById('view-home'),
  mode: document.getElementById('view-mode'),
  difficulty: document.getElementById('view-difficulty'),
  game: document.getElementById('view-game'),
};

// DOM references
const modeButtons = [...document.querySelectorAll('#modeGroup .pill')];
const difficultyButtons = [...document.querySelectorAll('#difficultyGroup .pill')];
const difficultyHint = document.getElementById('difficultyHint');
const turnHint = document.getElementById('turnHint');
const selectionSummary = document.getElementById('selectionSummary');
const choiceButtons = [...document.querySelectorAll('#choiceButtons .choice')];
const scoreP1El = document.getElementById('scoreP1');
const scoreP2El = document.getElementById('scoreP2');
const scoreTieEl = document.getElementById('scoreTie');
const resultText = document.getElementById('resultText');
const historyLog = document.getElementById('historyLog');
const resetBtn = document.getElementById('resetBtn');
const startPlayBtn = document.getElementById('startPlayBtn');
const modeNextBtn = document.getElementById('modeNextBtn');
const modeBackBtn = document.getElementById('modeBackBtn');
const difficultyNextBtn = document.getElementById('difficultyNextBtn');
const difficultyBackBtn = document.getElementById('difficultyBackBtn');
const changeSetupBtn = document.getElementById('changeSetupBtn');

function showView(target) {
  state.view = target;
  Object.entries(views).forEach(([name, el]) => {
    el.classList.toggle('active', name === target);
  });
}

function toLabel(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function setStartPrompts(message) {
  turnHint.textContent = state.mode === 'robot'
    ? 'You vs Robot. First to strike wins the round.'
    : 'Player 1 turn. Player 2, look away!';
  resultText.textContent = message || (state.mode === 'robot'
    ? 'Make your move against the robot.'
    : 'Player 1, pick in secret.');
}

function updateSelectionSummary() {
  const modeLabel = state.mode === 'robot' ? 'Robot' : 'Human';
  const difficultyLabel = state.mode === 'robot' ? ` · Difficulty: ${toLabel(state.difficulty)}` : ' · Pass-and-play';
  selectionSummary.textContent = `Mode: ${modeLabel}${difficultyLabel}`;
}

function setMode(mode) {
  state.mode = mode;
  modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  state.turn = 1;
  state.pendingChoice = null;

  if (state.view === 'game') {
    updateSelectionSummary();
    resetGame('Mode changed. Scores cleared.');
  }
}

function setDifficulty(difficulty) {
  state.difficulty = difficulty;
  difficultyButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.difficulty === difficulty));
  const hintMap = {
    easy: 'Easy: robot plays fair and random.',
    medium: 'Medium: robot sometimes counters you.',
    hard: 'Hard: robot usually counters you. Outsmart it!'
  };
  difficultyHint.textContent = hintMap[difficulty] || '';

  if (state.view === 'game' && state.mode === 'robot') {
    updateSelectionSummary();
    resetGame('Difficulty updated. Scores cleared.');
  }
}

function determineWinner(p1, p2) {
  if (p1 === p2) return 'tie';
  return beats[p1] === p2 ? 'p1' : 'p2';
}

function counterMove(playerMove) {
  return Object.keys(beats).find(move => beats[move] === playerMove) || randomMove();
}

function randomMove() {
  return moves[Math.floor(Math.random() * moves.length)];
}

function getRobotMove(playerMove) {
  const roll = Math.random();
  if (state.difficulty === 'easy') return randomMove();
  if (state.difficulty === 'medium') return roll < 0.6 ? counterMove(playerMove) : randomMove();
  return roll < 0.8 ? counterMove(playerMove) : randomMove();
}

function updateScores() {
  scoreP1El.textContent = state.scores.p1;
  scoreP2El.textContent = state.scores.p2;
  scoreTieEl.textContent = state.scores.tie;
}

function pushHistory(entry) {
  state.history.unshift(entry);
  if (state.history.length > 6) state.history.pop();
  historyLog.innerHTML = state.history
    .map(item => `<div class="item">${item}</div>`)
    .join('');
}

function playRobotRound(playerMove) {
  const robotMove = getRobotMove(playerMove);
  const outcome = determineWinner(playerMove, robotMove);

  if (outcome === 'p1') state.scores.p1 += 1;
  else if (outcome === 'p2') state.scores.p2 += 1;
  else state.scores.tie += 1;

  resultText.textContent = outcome === 'tie'
    ? `Tie! You both picked ${toLabel(playerMove)}.`
    : `${outcome === 'p1' ? 'You win' : 'Robot wins'} — You: ${toLabel(playerMove)} | Robot: ${toLabel(robotMove)}`;

  pushHistory(`You: ${toLabel(playerMove)} | Robot: ${toLabel(robotMove)} → ${outcome === 'tie' ? 'Tie' : outcome === 'p1' ? 'You' : 'Robot'} wins`);
  updateScores();
}

function playHumanRound(playerMove) {
  if (state.turn === 1) {
    state.pendingChoice = playerMove;
    state.turn = 2;
    resultText.textContent = 'Player 1 locked in. Player 2, choose now.';
    turnHint.textContent = 'Player 2 turn. Player 1, no peeking!';
    return;
  }

  const p1Move = state.pendingChoice;
  const p2Move = playerMove;
  const outcome = determineWinner(p1Move, p2Move);

  if (outcome === 'p1') state.scores.p1 += 1;
  else if (outcome === 'p2') state.scores.p2 += 1;
  else state.scores.tie += 1;

  resultText.textContent = outcome === 'tie'
    ? `Tie! Both played ${toLabel(p1Move)}.`
    : `${outcome === 'p1' ? 'Player 1' : 'Player 2'} wins — P1: ${toLabel(p1Move)} | P2: ${toLabel(p2Move)}`;

  pushHistory(`P1: ${toLabel(p1Move)} | P2: ${toLabel(p2Move)} → ${outcome === 'tie' ? 'Tie' : (outcome === 'p1' ? 'P1' : 'P2')} wins`);
  updateScores();

  state.turn = 1;
  state.pendingChoice = null;
  turnHint.textContent = 'Player 1 turn. Player 2, look away!';
}

function handleChoice(move) {
  if (state.mode === 'robot') {
    playRobotRound(move);
  } else {
    playHumanRound(move);
  }
}

function resetGame(message) {
  state.scores = { p1: 0, p2: 0, tie: 0 };
  state.turn = 1;
  state.pendingChoice = null;
  state.history = [];
  historyLog.innerHTML = '';
  setStartPrompts(message || 'Scores cleared. New match ready.');
  updateScores();
}

function goToGame() {
  updateSelectionSummary();
  resetGame();
  showView('game');
}

// Navigation events
startPlayBtn.addEventListener('click', () => showView('mode'));
modeBackBtn.addEventListener('click', () => showView('home'));
modeNextBtn.addEventListener('click', () => {
  if (state.mode === 'robot') {
    showView('difficulty');
  } else {
    goToGame();
  }
});

difficultyBackBtn.addEventListener('click', () => showView('mode'));
difficultyNextBtn.addEventListener('click', goToGame);
changeSetupBtn.addEventListener('click', () => {
  resetGame();
  showView('mode');
});

// Game interactions
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

difficultyButtons.forEach(btn => {
  btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
});

choiceButtons.forEach(btn => {
  btn.addEventListener('click', () => handleChoice(btn.dataset.move));
});

resetBtn.addEventListener('click', () => resetGame('Scores cleared. New match ready.'));

// Initial render
updateScores();
setMode(state.mode);
setDifficulty(state.difficulty);
setStartPrompts();
showView(state.view);
updateSelectionSummary();
