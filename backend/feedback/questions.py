"""The Pi Lab user-experience questionnaire: the single source of truth for the form, the checks and the spreadsheet.

Sections
  A  About you            name and occupation first (required), then background
  B  Ease of use          the System Usability Scale (SUS): 10 standard items, Brooke (1996), free to use.
                          Scored 0-100; about 68 is average, 80+ is good. Lets you compare Pi Lab with other studies.
  C  Learning             perceived learning and usefulness of each part (adapted from TAM "perceived usefulness"
                          and common e-learning evaluation items)
  D  Engagement           satisfaction, motivation, look and feel, overall rating, Net Promoter Score (0-10)
  E  Comments             open questions for qualitative analysis

Question types: text, choice (one), multi (several), likert (1-5 agree scale), rating (1-5), scale10 (0-10), long (comments).
Each question has a short `code` used as the spreadsheet column name (SUS1 … SUS10, L1 …).
Change the wording here and the form and the spreadsheet follow. Do not reuse a code for a different question
once responses are being collected.
"""

AGREE = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']

OCCUPATIONS = [
    'Undergraduate student', 'Postgraduate student', 'Lecturer / teaching staff',
    'Practising engineer', 'Researcher', 'Other',
]

SECTIONS = [
    {'id': 'about', 'title': 'About you', 'intro': 'Please tell us who you are first.', 'questions': [
        {'code': 'name', 'type': 'text', 'label': 'Your name', 'required': True, 'max': 100,
         'placeholder': 'Your full name'},
        {'code': 'occupation', 'type': 'choice', 'label': 'Your occupation', 'required': True,
         'options': OCCUPATIONS, 'other': 'Other'},
        {'code': 'field', 'type': 'text', 'label': 'Programme, field of study or job', 'required': False, 'max': 120,
         'placeholder': 'e.g. Mechanical Engineering, Year 3'},
        {'code': 'prior', 'type': 'choice', 'label': 'Before using Pi Lab, how well did you know the Buckingham Pi theorem?',
         'required': True, 'options': ['Not at all', 'I had heard of it', 'I had studied it in class', 'I could use it confidently']},
        {'code': 'used', 'type': 'multi', 'label': 'Which parts of Pi Lab did you use?', 'required': True,
         'options': ['Guide (worked examples)', 'Exercises', 'Π-group calculator', 'Symbol keyboard']},
    ]},
    {'id': 'sus', 'title': 'Ease of use', 'scale': 'agree',
     'intro': 'How much do you agree with each statement? Answer quickly with your first impression.', 'questions': [
        {'code': 'SUS1', 'type': 'likert', 'label': 'I think that I would like to use Pi Lab frequently.'},
        {'code': 'SUS2', 'type': 'likert', 'label': 'I found Pi Lab unnecessarily complex.'},
        {'code': 'SUS3', 'type': 'likert', 'label': 'I thought Pi Lab was easy to use.'},
        {'code': 'SUS4', 'type': 'likert', 'label': 'I think that I would need the support of a technical person to be able to use Pi Lab.'},
        {'code': 'SUS5', 'type': 'likert', 'label': 'I found the various functions in Pi Lab were well integrated.'},
        {'code': 'SUS6', 'type': 'likert', 'label': 'I thought there was too much inconsistency in Pi Lab.'},
        {'code': 'SUS7', 'type': 'likert', 'label': 'I would imagine that most people would learn to use Pi Lab very quickly.'},
        {'code': 'SUS8', 'type': 'likert', 'label': 'I found Pi Lab very cumbersome to use.'},
        {'code': 'SUS9', 'type': 'likert', 'label': 'I felt very confident using Pi Lab.'},
        {'code': 'SUS10', 'type': 'likert', 'label': 'I needed to learn a lot of things before I could get going with Pi Lab.'},
    ]},
    {'id': 'learning', 'title': 'Learning', 'scale': 'agree',
     'intro': 'How well did Pi Lab help you learn?', 'questions': [
        {'code': 'L1', 'type': 'likert', 'label': 'The guide helped me understand the steps of the Buckingham Pi theorem.'},
        {'code': 'L2', 'type': 'likert', 'label': 'The worked examples made it clear how to choose repeating variables.'},
        {'code': 'L3', 'type': 'likert', 'label': 'The exercises helped me practise what I learned in the guide.'},
        {'code': 'L4', 'type': 'likert', 'label': 'The hints and feedback in the exercises helped me correct my mistakes.'},
        {'code': 'L5', 'type': 'likert', 'label': 'The calculator helped me check my own answers.'},
        {'code': 'L6', 'type': 'likert', 'label': 'Seeing well-known numbers (Reynolds, Nusselt …) helped me connect the Π groups to real physics.'},
        {'code': 'L7', 'type': 'likert', 'label': 'After using Pi Lab I feel more confident solving dimensional analysis problems.'},
        {'code': 'L8', 'type': 'likert', 'label': 'Pi Lab would be useful for my studies or work.'},
    ]},
    {'id': 'engage', 'title': 'Engagement and satisfaction', 'scale': 'agree',
     'intro': 'How did using Pi Lab feel?', 'questions': [
        {'code': 'E1', 'type': 'likert', 'label': 'The interactive activities kept me interested.'},
        {'code': 'E2', 'type': 'likert', 'label': 'The layout and visual design are clear and pleasant.'},
        {'code': 'E3', 'type': 'likert', 'label': 'The text and explanations were easy to understand.'},
        {'code': 'E4', 'type': 'likert', 'label': 'Pi Lab worked well on the device I used.'},
        {'code': 'E5', 'type': 'likert', 'label': 'I prefer learning this topic with Pi Lab over textbook notes alone.'},
        {'code': 'overall', 'type': 'rating', 'label': 'Overall, how would you rate Pi Lab?', 'required': True,
         'options': ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent']},
        {'code': 'recommend', 'type': 'scale10', 'label': 'How likely are you to recommend Pi Lab to a classmate or colleague?',
         'required': True, 'low': 'Not at all likely', 'high': 'Extremely likely'},
    ]},
    {'id': 'comments', 'title': 'Your comments', 'intro': 'Optional, but very helpful.', 'questions': [
        {'code': 'liked', 'type': 'long', 'label': 'What did you like most about Pi Lab?', 'required': False, 'max': 2000},
        {'code': 'improve', 'type': 'long', 'label': 'What should be improved or added?', 'required': False, 'max': 2000},
        {'code': 'problems', 'type': 'long', 'label': 'Did anything not work or confuse you? Where?', 'required': False, 'max': 2000},
    ]},
]

# likert questions are required unless they say otherwise
for _s in SECTIONS:
    for _q in _s['questions']:
        _q.setdefault('required', _q['type'] in ('likert', 'rating', 'scale10'))
        _q['section'] = _s['title']

QUESTIONS = [q for s in SECTIONS for q in s['questions']]
BY_CODE = {q['code']: q for q in QUESTIONS}
SUS_CODES = [f'SUS{i}' for i in range(1, 11)]


def sus_score(answers):
    """System Usability Scale, 0-100. Odd items: score − 1; even items: 5 − score; total × 2.5."""
    try:
        vals = [int(answers[c]) for c in SUS_CODES]
    except (KeyError, TypeError, ValueError):
        return None
    return sum((v - 1) if i % 2 == 0 else (5 - v) for i, v in enumerate(vals)) * 2.5


def sus_grade(score):
    """A plain-language reading of a SUS score (Bangor, Kortum and Miller's adjective scale, rounded)."""
    if score is None:
        return ''
    for limit, word in ((85, 'Excellent'), (72, 'Good'), (52, 'OK'), (38, 'Poor')):
        if score >= limit:
            return word
    return 'Awful'


def public():
    """The questionnaire as the web page needs it."""
    return {'sections': SECTIONS, 'agree': AGREE}
