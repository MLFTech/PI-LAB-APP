/* Feedback page wording. The questions themselves live in backend/feedback/questions.py
   (one place for the form, the database checks and the spreadsheet); the page fetches them from `api.questions`. */
window.PiLab.feedback = {
  title: 'Feedback',
  lead: 'Help improve Pi Lab. This short questionnaire takes about 5 minutes and is part of a final year project on learning with interactive tools.',
  privacy: 'Your Google email, name, occupation and answers are saved by Pi Lab and used only to evaluate this project. Results are reported as totals, never with your name or email. <a href="privacy/">Privacy policy</a>',
  api: { questions: 'api/feedback/questions/', submit: 'api/feedback/' },
  required: 'required',
  otherLabel: 'Please type your occupation',
  submit: 'Send feedback',
  progress: (done, total) => `${done} of ${total} required answers`,
  missing: 'Please answer the highlighted question first.',
  thanks: { title: 'Thank you!', text: 'Your feedback has been saved. It really helps this project.' },
  signin: {
    title: 'Sign in to give feedback',
    text: 'Please sign in with your Google account first. Each account can send the questionnaire once, so every response comes from a different person.',
    button: 'Sign in with Google',
    why: 'Pi Lab saves your Google email address with your answers, only to make sure each person responds once.',
    notGoogle: 'You are signed in with an admin account. Sign out, then sign in with Google to answer.',
    notSetUp: 'Google sign-in is not set up on this server yet, so the questionnaire is closed. Site owner: see "Google sign-in" in README.md.',
    as: 'Signed in as', notYou: 'Not you? Sign out',
    doneTitle: 'You have already responded',
    doneText: (email, when) => `Thank you! Feedback from <b>${email}</b> was received${when ? ' on ' + when : ''}. Each Google account can respond once.`,
  },
  offline: 'The feedback form needs the Pi Lab server. Start it from the pilab folder with <code>python backend/manage.py runserver</code>, then open <code>http://127.0.0.1:8000/#/feedback</code>.',
  draftNote: 'Your answers are kept in this browser until you send them.',
};
