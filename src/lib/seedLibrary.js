/**
 * Example prompts added in seed set v2 (Promptvault 1.3.0).
 *
 * IMPORTED: curated from f/awesome-chatgpt-prompts (prompts.csv), whose prompt
 * data is dedicated to the public domain under CC0 1.0 Universal. Light edits:
 * placeholders turned into {{variables}}, wording tidied, tags/category added.
 * See THIRD-PARTY-NOTICES.md.
 *
 * ORIGINAL: written for Promptvault to show off template variables.
 */
export const SOURCE_NOTE = 'Source: awesome-chatgpt-prompts (CC0 1.0)';
const src = (act, extra = '') => `${SOURCE_NOTE}, adapted from "${act}".${extra ? ` ${extra}` : ''}`;

export const IMPORTED = [
  // ---- Writing ----
  {
    title: 'English translator and improver',
    category: 'Writing',
    tags: ['writing', 'translation', 'editing'],
    body:
      'I want you to act as an English translator, spelling corrector and improver. I will write to you in any language; detect the language, translate it and answer with the corrected and improved version of my text, in English. Replace simplified words and sentences with more elegant, upper-level English while keeping the meaning the same. Only reply with the correction and improvements — no explanations.\n\nMy text:\n{{text}}',
    notes: src('English Translator and Improver'),
  },
  {
    title: 'Proofreader',
    category: 'Writing',
    tags: ['writing', 'editing'],
    body:
      'I want you to act as a proofreader. Review the text below for any spelling, grammar or punctuation errors. When you have finished, give me the necessary corrections and any suggestions for improving the text.\n\nText:\n{{text}}',
    notes: src('Proofreader'),
  },
  {
    title: 'Clarity rewriter',
    category: 'Writing',
    tags: ['writing', 'editing'],
    body:
      "Rewrite the text below so it becomes clearer, more concise and easy to understand for a general audience. Keep the original meaning intact. Remove unnecessary jargon, filler words and overly long sentences. If the text contains unclear arguments, briefly point them out and suggest a clearer version.\n\nOffer the rewritten text first, then a short note explaining the major improvements. Do not add new facts or invent details.\n\nText:\n{{content}}",
    notes: src('Smart Rewriter & Clarity Booster'),
  },
  {
    title: 'Persuasive essay writer',
    category: 'Writing',
    tags: ['writing'],
    body:
      'I want you to act as an essay writer. Research the topic below, formulate a thesis statement, and write a persuasive piece that is both informative and engaging.\n\nTopic: {{topic}}\nAudience: {{audience}}\nLength: about {{word_count}} words',
    notes: src('Essay Writer'),
  },
  {
    title: 'Title generator',
    category: 'Writing',
    tags: ['writing', 'ideas'],
    body:
      'I want you to act as a title generator for written pieces. I will give you the topic and key words of an article, and you will generate five attention-grabbing titles. Keep each title concise (under 20 words) and make sure the meaning is maintained. Reply in the language of the topic.\n\nTopic: {{topic}}\nKey words: {{keywords}}',
    notes: src('Title Generator for written pieces'),
  },
  {
    title: 'How-to guide writer',
    category: 'Writing',
    tags: ['writing', 'docs'],
    body:
      'I want you to act as a tech writer. Act as a creative and engaging technical writer and turn the basic steps below into an engaging how-to article for {{software_name}}. Where a screenshot would help, add "(screenshot)" and I will add it later.\n\nSteps:\n{{steps}}',
    notes: src('Tech Writer'),
  },
  {
    title: 'Text summarizer',
    category: 'Writing',
    tags: ['summary', 'writing'],
    body:
      'Act as a text summarizer. You are an expert in distilling complex texts into concise summaries. Extract the core essence of the text below, highlighting key points and themes.\n\n- Identify and summarize the main ideas and arguments\n- Keep the summary clear and concise, maintaining the original meaning\n- Use a neutral, informative tone and do not add personal opinions\n- Keep it under {{max_words}} words\n\nText:\n{{text}}',
    notes: src('Text Summarizer'),
  },
  {
    title: 'Release notes from a changelog',
    category: 'Writing',
    tags: ['writing', 'coding', 'docs'],
    body:
      'You are a release-notes editor. Given raw changelog bullets, PR titles or commit messages, produce:\n\n1. **User-facing release notes** (plain language, benefit-first, no jargon unless necessary)\n2. **Engineer notes** (breaking changes, migrations, config flags)\n3. **Risk & rollout** (what to watch, feature flags, rollback hints)\n\nRules:\n- Group by theme, not by PR number.\n- Call out breaking changes first.\n- Never invent features that are not in the input.\n- If the input is ambiguous, ask up to 3 clarifying questions before drafting.\n\nAudience: {{audience}}\nTone: {{tone}}\n\nInput:\n{{changelog}}',
    notes: src('Changelog Diff Summarizer for Release Notes'),
  },

  // ---- Coding ----
  {
    title: 'Code reviewer',
    category: 'Coding',
    tags: ['coding', 'review'],
    body:
      'I want you to act as a code reviewer who is an experienced {{language}} developer. Review the code below and share feedback, suggestions and alternative recommended approaches. Explain the reasoning behind each piece of feedback.\n\n```\n{{code}}\n```',
    notes: src('Code Reviewer'),
  },
  {
    title: 'Severity-ranked code review',
    category: 'Coding',
    tags: ['coding', 'review'],
    body:
      'You are a meticulous senior software engineer doing code review.\n\nGoals, in priority order:\n1. Correctness bugs (logic errors, off-by-one, null/undefined, race conditions, wrong error handling).\n2. Security (injection, secrets in code, unsafe deserialization, missing auth checks, SSRF, XSS).\n3. Data loss or performance traps (N+1 queries, unbounded loops, memory leaks).\n4. Readability and maintainability.\n5. Style nits (only if nothing more important exists).\n\nRules:\n- Only comment on code you were given. If context is missing, say what you would need instead of guessing.\n- Quote the exact line(s) for every finding.\n- For every finding give: severity (BLOCKER / HIGH / MEDIUM / NIT), why it matters in one sentence, and a concrete fix.\n- Do not invent issues to seem thorough. If the code is fine, say "No blocking issues found" and list at most 3 optional improvements.\n- End with a one-line verdict: APPROVE, APPROVE WITH NITS, or REQUEST CHANGES.\n\nOutput format:\n## Verdict\n## Findings (ordered by severity)\n## Questions for the author\n\nCode:\n```\n{{code}}\n```',
    notes: src('Senior Code Reviewer (severity-ranked)'),
  },
  {
    title: 'Commit message generator',
    category: 'Coding',
    tags: ['coding', 'git'],
    body:
      'I want you to act as a commit message generator. Using the task information below, generate an appropriate commit message in the Conventional Commits format. Do not write any explanations or other words, just reply with the commit message.\n\nTask code prefix: {{task_prefix}}\nChanges:\n{{changes}}',
    notes: src('Commit Message Generator'),
  },
  {
    title: 'Unit test writer',
    category: 'Coding',
    tags: ['coding', 'testing'],
    body:
      'Act as an expert software engineer in test with strong experience in {{language}} who is teaching a junior developer how to write tests. Analyze the code below and reply with the test cases and the test code ({{test_framework}}).\n\n```\n{{code}}\n```',
    notes: src('Unit Tester Assistant'),
  },
  {
    title: 'Code translator',
    category: 'Coding',
    tags: ['coding', 'translation'],
    body:
      'Act as a code translator. Take the code below, written in {{source_language}}, and translate it into {{target_language}}.\n\n- Analyze the syntax and semantics of the source code.\n- Convert it to the target language while preserving functionality and structure.\n- Add comments to explain key parts of the translated code.\n\n```\n{{code}}\n```',
    notes: src('Code Translator: Any Language to Any Language'),
  },
  {
    title: 'Debugging detective',
    category: 'Coding',
    tags: ['coding', 'debugging'],
    body:
      'Act as a senior debugging engineer with many years of experience finding root causes in production systems. I will describe a bug or unexpected behavior, and you will help me systematically diagnose it:\n\n1. Ask clarifying questions if the symptom description is incomplete (error message, expected vs actual behavior, when it started, recent changes).\n2. List the 3–5 most likely root causes, ranked by probability, with a one-line reason for each.\n3. For the top suspect, tell me exactly what to check or log to confirm or rule it out.\n4. Once confirmed, explain the fix and why the bug happened, so I avoid the same class of mistake.\n5. Flag if this looks like a symptom of a deeper architectural issue.\n\nKeep questions minimal and targeted. Prioritize the fastest path to the root cause.\n\nMy issue:\n{{bug_description}}',
    notes: src('Debugging Detective'),
  },
  {
    title: 'IT architect: system integration',
    category: 'Coding',
    tags: ['coding', 'architecture'],
    body:
      'I want you to act as an IT architect. I will describe the functionality of an application, and you will work out how to integrate it into the existing IT landscape: analyze business requirements, perform a gap analysis, and map the new system to the existing landscape. Then propose a solution design, a network blueprint, the interfaces for system integration and a blueprint for the deployment environment.\n\nNew system: {{new_system}}\nExisting landscape: {{existing_landscape}}',
    notes: src('IT Architect'),
  },
  {
    title: 'UX improvement ideas',
    category: 'Coding',
    tags: ['design', 'ideas'],
    body:
      'I want you to act as a UX/UI developer. I will describe the design of an app, website or other digital product, and you will come up with creative ways to improve its user experience — prototypes to try, design alternatives to test, and feedback on what is likely to work best.\n\nProduct: {{product}}\nProblem to solve: {{ux_problem}}',
    notes: src('UX/UI Developer'),
  },

  // ---- Career ----
  {
    title: 'Mock job interview',
    category: 'Career',
    tags: ['career', 'interview'],
    body:
      'I want you to act as an interviewer. I will be the candidate and you will ask me the interview questions for the {{position}} position. Only reply as the interviewer. Do not write the whole conversation at once: ask me the questions one by one, like a real interviewer, and wait for my answers. Do not write explanations.\n\nStart by greeting me and asking the first question.',
    notes: src('Job Interviewer'),
  },
  {
    title: 'Interview preparation coach',
    category: 'Career',
    tags: ['career', 'interview'],
    body:
      'Act as an interview preparation coach and guide me through effective preparation for a {{job_role}} interview in the {{industry}} industry.\n\n- Give advice tailored to the role and industry\n- Help me practice common interview questions\n- Offer tips on communication and body language\n- Suggest strategies for difficult questions and scenarios\n\nKeep a professional and supportive tone.',
    notes: src('Interview Preparation Coach'),
  },
  {
    title: 'Career coach',
    category: 'Career',
    tags: ['career', 'planning'],
    body:
      'I want you to act as a career coach. Based on my background, skills, interests and goals below, guide me on how to achieve my career aspirations. Include specific steps for improving my skills, expanding my professional network and crafting a compelling resume or portfolio. Also suggest roles or industries that align with my strengths.\n\nBackground: {{background}}\nGoal: {{goal}}',
    notes: src('Career Coach'),
  },
  {
    title: 'Career options explorer',
    category: 'Career',
    tags: ['career'],
    body:
      'I want you to act as a career counselor. Help me work out which careers I am best suited for based on my skills, interests and experience. Explain trends in the relevant industries and which qualifications would help in each field.\n\nSkills: {{skills}}\nInterests: {{interests}}\nExperience: {{experience}}',
    notes: src('Career Counselor'),
  },
  {
    title: 'Resume reviewer',
    category: 'Career',
    tags: ['career', 'resume', 'review'],
    body:
      'Act as a resume reviewer: an experienced recruiter evaluating a resume for a specific job opening.\n\n- Analyze the resume for qualifications and experience relevant to the job description.\n- Give constructive feedback on strengths and areas for improvement.\n- Highlight discrepancies or concerns a recruiter might notice.\n\nFocus on relevant skills and experience.\n\nJob description:\n{{job_description}}\n\nResume:\n{{resume}}',
    notes: src('Act as a Resume Reviewer'),
  },
  {
    title: 'Tailor my resume to a job',
    category: 'Career',
    tags: ['career', 'resume'],
    body:
      'Act as an expert recruiter in the {{industry}} industry. I will give you my current resume and a job description for a {{job_title}} role.\n\n1. Identify the 10 most critical skills (hard and soft), tools and keywords in the job description.\n2. Compare them to my resume and identify gaps.\n3. Rewrite my work experience bullets and skills section to naturally include these keywords, using results-oriented language and the Challenge-Action-Result method.\n\nJob description:\n{{job_description}}\n\nMy resume:\n{{resume}}',
    notes: src('Resume tailoring', 'Only include experience you really have.'),
  },

  // ---- Learning ----
  {
    title: 'Patient math teacher',
    category: 'Learning',
    tags: ['learning', 'explain'],
    body:
      'I want you to act as a math teacher. Explain the concept or problem below in easy-to-understand terms. Include step-by-step instructions for solving it, demonstrate useful techniques, and suggest what to study next.\n\nConcept or problem: {{math_topic}}',
    notes: src('Math Teacher'),
  },
  {
    title: 'Socratic questioning partner',
    category: 'Learning',
    tags: ['learning', 'decision'],
    body:
      'I want you to use the Socratic method to question my beliefs. I will make a statement and you will question it to test my logic. Respond with one question at a time and wait for my answer.\n\nMy first claim: {{claim}}',
    notes: src('Socratic Method'),
  },
  {
    title: 'Explain with three analogies',
    category: 'Learning',
    tags: ['learning', 'explain'],
    body:
      'I want you to act as an explainer who uses analogies to clarify complex topics. For the subject below:\n\n1. Ask me 1–2 quick questions to assess my current level of understanding.\n2. Based on my answer, create three analogies:\n   - one a 10-year-old would understand (simple, everyday)\n   - one for a high-school student (intermediate)\n   - one for a college-level reader (deep, with accurate parallels)\n3. After each analogy, briefly explain how it relates to the topic.\n4. End with a 2–3 sentence plain explanation of the concept.\n\nBe friendly, patient and curious.\n\nSubject: {{subject}}',
    notes: src('Explainer with Analogies'),
  },
  {
    title: 'Lecture note-taker',
    category: 'Learning',
    tags: ['learning', 'study', 'summary'],
    body:
      'I want you to act as a note-taking assistant for a lecture. From the transcript below, produce a detailed note list that includes examples from the lecture and focuses on what is likely to come up in quiz questions. Also make a separate list for notes that contain numbers and data, and another for the examples used. Keep the notes concise and easy to read.\n\nLecture transcript:\n{{transcript}}',
    notes: src('Note-Taking assistant'),
  },
  {
    title: 'Personal study plan',
    category: 'Learning',
    tags: ['learning', 'study', 'planning'],
    body:
      'I want you to act as an advanced study plan generator: an expert in education who builds personalized study plans that improve academic performance and keep a healthy balance. Take into account my courses, available time, responsibilities and deadlines.\n\nCourses: {{courses}}\nTime available per week: {{hours_per_week}}\nOther responsibilities: {{responsibilities}}\nDeadlines: {{deadlines}}',
    notes: src('Study planner'),
  },
  {
    title: 'Writing tutor',
    category: 'Learning',
    tags: ['learning', 'writing', 'editing'],
    body:
      'I want you to act as a writing tutor. Give me feedback on how to improve the composition below, using your knowledge of rhetoric and effective writing techniques. Suggest ways I can better express my thoughts and ideas, and explain why each suggestion helps.\n\nType of writing: {{writing_type}}\n\nDraft:\n{{draft}}',
    notes: src('AI Writing Tutor'),
  },

  // ---- Productivity ----
  {
    title: 'Prompt generator',
    category: 'Productivity',
    tags: ['prompts', 'productivity'],
    body:
      'I want you to act as a prompt generator. I will give you a title like "Act as an English pronunciation helper", and you will write a self-explanatory prompt that fits the title (for example: "I want you to act as an English pronunciation assistant… My first sentence is …"). Adapt the prompt to the title; do not refer to this example. Reply with the prompt only.\n\nTitle: {{title}}',
    notes: src('Prompt Generator'),
  },
  {
    title: 'Decision filter',
    category: 'Productivity',
    tags: ['decision', 'productivity'],
    body:
      'I want you to act as a decision filter. When I am stuck between choices, remove the noise, clarify what actually matters and lead me to a clean, justified decision. Reply with only four things:\n\n1. A precise restatement of the decision\n2. The three criteria that genuinely define the best choice\n3. The option I should pick when those criteria are weighted properly\n4. One concise sentence explaining the reasoning\n\nMy situation: {{situation}}',
    notes: src('Decision Filter'),
  },
  {
    title: 'Decision matrix: option A vs B',
    category: 'Productivity',
    tags: ['decision', 'planning'],
    body:
      'Act as a strategy consultant. I must choose between {{option_a}} and {{option_b}}.\n\nContext (details, worries, goals): {{context}}\n\nAnalyze the decision:\n- **Opportunity cost:** what do I give up with each option?\n- **Second- and third-order effects:** if I choose A, what happens in 10 minutes, 10 months and 10 years? Same for B.\n- **Regret check:** which option minimizes future regret if things go wrong?\n- **Devil\'s advocate:** attack my currently preferred option to see if it holds up.\n- **Verdict:** your reasoned recommendation.',
    notes: src('Strategic Decision-Making Matrix'),
  },
  {
    title: 'Meeting transcript summary',
    category: 'Productivity',
    tags: ['meetings', 'summary'],
    body:
      'The following is a meeting transcript. Please:\n\n1. Summarize the meeting in 1–2 paragraphs.\n2. List clear and concise action items (include who is responsible if available).\n\nReturn format:\nSummary: <summary>\nAction Items:\n- [ ] item 1\n- [ ] item 2\n\nWrite the summary in {{language}}.\n\nTranscript:\n{{transcript}}',
    notes: src('Default Meeting Summary'),
  },

  // ---- Data & Analysis ----
  {
    title: 'Data analyst: first look at a dataset',
    category: 'Data & Analysis',
    tags: ['data'],
    body:
      'Act as a data analyst. For the dataset below:\n\n- Explain what the data is about\n- Identify key questions that can be answered with it\n- Extract the fundamental insights and explain them in simple language\n\nUse clear, concise language, focus on actionable insights, and make the explanation understandable to non-experts.\n\nDataset (sample or description):\n{{dataset}}',
    notes: src('Data Analyst'),
  },
  {
    title: 'Statistics helper',
    category: 'Data & Analysis',
    tags: ['data', 'explain'],
    body:
      'I want you to act as a statistician with deep knowledge of statistical terminology, distributions, confidence intervals, probability, hypothesis testing and statistical charts. Help me with the problem below, showing your reasoning and any assumptions.\n\nProblem: {{statistics_question}}',
    notes: src('Statistician'),
  },
  {
    title: 'Spreadsheet formula builder',
    category: 'Data & Analysis',
    tags: ['data', 'spreadsheet'],
    body:
      'Act as a spreadsheet formula generator. I need a formula that calculates {{calculation}}. The input data is {{data_description}}. Take these requirements into account: {{constraints}}.\n\nGive me the formula, then explain how it works step by step, including the functions, operators and references it uses.',
    notes: src('Excel Formula Sensei'),
  },
  {
    title: 'Log triage: errors around an incident',
    category: 'Data & Analysis',
    tags: ['data', 'debugging'],
    body:
      'From the log below, show only the lines from {{minutes}} minutes before to {{minutes}} minutes after {{incident_time}}, plus any line anywhere marked ERROR or FATAL. Quote each line exactly and keep the original order. Tell me how many lines you left out. Do not summarize yet.\n\nLog:\n{{log}}',
    notes: src('Support log triage: show only the problem window and ERROR or FATAL lines, quoted exactly'),
  },

  // ---- Creative ----
  {
    title: 'Storyteller',
    category: 'Creative',
    tags: ['creative', 'story'],
    body:
      'I want you to act as a storyteller. Come up with an entertaining story that is engaging, imaginative and captivating for the audience. Choose themes that suit the audience (for children, perhaps animals; for adults, perhaps history-based tales).\n\nAudience: {{audience}}\nTheme: {{theme}}',
    notes: src('Storyteller'),
  },
  {
    title: 'Novel planner',
    category: 'Creative',
    tags: ['creative', 'story'],
    body:
      'I want you to act as a novelist. Come up with a creative, captivating story that can hold readers for a long time: an outstanding plotline, engaging characters and unexpected climaxes. Start with the premise, main characters and a chapter outline.\n\nGenre: {{genre}}\nSetting: {{setting}}',
    notes: src('Novelist'),
  },
  {
    title: 'Poet',
    category: 'Creative',
    tags: ['creative'],
    body:
      'I want you to act as a poet. Write a poem that evokes emotion and conveys its feeling in beautiful yet meaningful ways.\n\nTopic: {{topic}}\nForm or style: {{style}}',
    notes: src('Poet'),
  },
  {
    title: 'Startup idea generator',
    category: 'Creative',
    tags: ['ideas', 'product'],
    body:
      'Generate a digital startup idea based on the wish below. Include: idea name, a short one-liner, target user persona, pain points to solve, main value propositions, sales and marketing channels, revenue streams, cost structure, key activities, key resources, key partners, idea validation steps, estimated first-year operating cost, and potential business challenges. Write the result as a Markdown table.\n\nWish: "I wish there was {{wish}}"',
    notes: src('Startup Idea Generator'),
  },

  // ---- Communication ----
  {
    title: 'Public speaking coach',
    category: 'Communication',
    tags: ['communication', 'speaking'],
    body:
      'I want you to act as a public speaking coach. Develop clear communication strategies, give professional advice on body language and voice, teach techniques for capturing the audience\'s attention, and help overcome nerves about speaking in public.\n\nSpeaker and occasion: {{occasion}}\nTalk topic: {{talk_topic}}',
    notes: src('Public Speaking Coach'),
  },
  {
    title: 'Debate coach',
    category: 'Communication',
    tags: ['communication', 'speaking'],
    body:
      'I want you to act as a debate coach. Prepare me (or my team) for an upcoming debate by organizing practice rounds that focus on persuasive speech, effective timing, refuting opposing arguments, and drawing in-depth conclusions from evidence.\n\nMotion: {{motion}}\nOur side: {{side}}',
    notes: src('Debate Coach'),
  },
];

export const ORIGINAL = [
  {
    title: 'Meeting notes → summary and action items',
    category: 'Productivity',
    tags: ['meetings', 'summary'],
    body:
      'Turn these notes from the **{{meeting_name}}** meeting into a summary for {{audience}}.\n\n## Format\n1. **TL;DR** — 2 sentences\n2. **Decisions made** — bullet list\n3. **Action items** — table with Owner | Task | Due date (write "unassigned" if unclear)\n4. **Open questions**\n\nKeep it under {{word_limit}} words. Do not invent owners or dates.\n\nNotes:\n{{notes}}',
    notes: 'Paste raw notes or a transcript. Works well followed by "Draft the follow-up email".',
  },
  {
    title: 'Rewrite an email in a different tone',
    category: 'Communication',
    tags: ['email', 'writing'],
    body:
      'Rewrite the email below so it sounds **{{tone}}** (for example: warm, firm, apologetic, concise, formal).\n\n- Recipient: {{recipient}}\n- Goal of the email: {{goal}}\n- Keep all facts, dates and numbers exactly as written\n- Max {{max_words}} words\n\nGive me the rewritten email, then one alternative subject line.\n\nOriginal email:\n{{email}}',
    notes: 'Try the same email with two different {{tone}} values and compare.',
  },
  {
    title: 'Pull request review',
    category: 'Coding',
    tags: ['coding', 'review'],
    body:
      'Review this {{language}} change as a senior engineer on a team that values {{team_priorities}}.\n\nContext: {{context}}\n\nFor each finding give: file/line, severity (blocker / should-fix / nit), the problem, and a suggested fix. Then list anything that needs a test. Finish with "Ship it", "Ship with fixes" or "Needs another pass".\n\n```diff\n{{diff}}\n```',
    notes: 'Paste the output of `git diff` as {{diff}}.',
  },
  {
    title: 'Study plan for an exam',
    category: 'Learning',
    tags: ['study', 'learning', 'planning'],
    body:
      'Create a study plan to prepare for **{{exam_or_skill}}** by {{deadline}}.\n\n- Current level: {{current_level}}\n- Time available: {{hours_per_week}} hours per week\n- Preferred resources: {{resources}}\n\nBreak it into weekly goals with daily sessions, include spaced-repetition review days and a practice test every {{test_interval}}. End with a checklist of the 10 most important topics.',
    notes: '',
  },
  {
    title: 'PRD outline',
    category: 'Productivity',
    tags: ['product', 'planning', 'docs'],
    body:
      'Draft a product requirements document (PRD) outline for **{{feature_name}}** in {{product}}.\n\nTarget users: {{target_users}}\nProblem: {{problem}}\n\nSections:\n1. Summary\n2. Problem and evidence\n3. Goals and non-goals\n4. User stories (as a … I want … so that …)\n5. Requirements (must / should / could)\n6. Success metrics\n7. Risks and open questions\n8. Rollout plan\n\nUse placeholders like [TBD] rather than inventing data.',
    notes: '',
  },
  {
    title: 'Explain this SQL query',
    category: 'Data & Analysis',
    tags: ['sql', 'data', 'explain'],
    body:
      'Explain this {{sql_dialect}} query for {{audience}}.\n\n1. What question it answers, in one sentence\n2. Step-by-step walk-through (tables, joins, filters, grouping)\n3. Possible bugs or performance problems (missing indexes, accidental cross joins, NULL handling)\n4. A suggested improved version, if any — explain each change\n\n```sql\n{{query}}\n```',
    notes: 'Set {{audience}} to "a non-technical manager" or "a junior analyst" to change the depth.',
  },
  {
    title: 'Bug report triage',
    category: 'Coding',
    tags: ['debugging', 'coding'],
    body:
      'Triage this bug report for {{product}}.\n\nReturn:\n- **Summary** (one line, suitable as an issue title)\n- **Severity** (critical / high / medium / low) with a one-sentence justification\n- **Likely area** of the code or system\n- **Missing information** to ask the reporter for\n- **Steps to reproduce**, rewritten clearly\n- **Suggested labels** from: {{labels}}\n\nBug report:\n{{bug_report}}',
    notes: '',
  },
  {
    title: 'Write a regular expression',
    category: 'Coding',
    tags: ['coding'],
    body:
      'Write a {{regex_flavor}} regular expression that matches {{what_to_match}} and does **not** match {{what_not_to_match}}.\n\nGive me:\n1. The pattern\n2. A plain-English explanation of each part\n3. Five strings that match and five that do not\n4. Any edge cases to watch for',
    notes: '',
  },
  {
    title: 'Explain code line by line',
    category: 'Learning',
    tags: ['coding', 'explain', 'learning'],
    body:
      'Explain the {{language}} code below to someone with {{experience_level}} experience.\n\nStart with a 2-sentence overview of what it does, then walk through it section by section. Point out any concepts I should look up, and finish with one small exercise that changes the code.\n\n```\n{{code}}\n```',
    notes: '',
  },
  {
    title: 'Weekly status update',
    category: 'Communication',
    tags: ['communication', 'writing'],
    body:
      'Write a weekly status update for {{project}} addressed to {{audience}}.\n\nThis week: {{done}}\nNext week: {{next}}\nRisks or blockers: {{risks}}\n\nFormat: three short sections with bullets, a one-line overall status (On track / At risk / Off track), and no more than {{word_limit}} words.',
    notes: '',
  },
  {
    title: 'Give constructive feedback',
    category: 'Communication',
    tags: ['communication', 'career'],
    body:
      'Help me give constructive feedback to {{person_role}} about {{situation}}.\n\nI want the conversation to be {{tone}} and end with {{desired_outcome}}.\n\nGive me:\n1. An opening line\n2. The feedback using Situation – Behavior – Impact\n3. Two questions to invite their perspective\n4. A suggested next step we can agree on',
    notes: '',
  },
  {
    title: 'Quiz me on a topic',
    category: 'Learning',
    tags: ['study', 'learning'],
    body:
      'Quiz me on **{{topic}}** at a {{difficulty}} level.\n\nAsk {{number_of_questions}} questions one at a time and wait for my answer before continuing. Mix multiple-choice and short-answer questions. After each answer, tell me if I was right and explain briefly. At the end, summarize my weak spots and what to review.',
    notes: '',
  },
  {
    title: 'Brainstorm with constraints',
    category: 'Creative',
    tags: ['ideas', 'creative'],
    body:
      'Brainstorm {{number_of_ideas}} ideas for {{goal}}.\n\nConstraints:\n- Budget: {{budget}}\n- Time: {{timeframe}}\n- Must avoid: {{avoid}}\n\nGroup the ideas into safe bets, bold bets and wildcards. For the top 3, add the first concrete step to try this week.',
    notes: 'Follow up with "expand idea #N" to go deeper.',
  },
  {
    title: 'Turn a spreadsheet into insights',
    category: 'Data & Analysis',
    tags: ['data', 'spreadsheet'],
    body:
      'Here is data from a spreadsheet about {{subject}} (columns: {{columns}}).\n\nI need to decide {{decision}}.\n\n1. Describe the data and any quality problems (missing values, outliers, odd units)\n2. Give the 3–5 most useful insights for my decision, each with the numbers behind it\n3. Suggest one chart that would show the key insight, and what goes on each axis\n4. List what further data would make the decision easier\n\nData:\n{{data}}',
    notes: 'Paste a CSV export; trim it to the relevant rows first.',
  },
  {
    title: 'Job description from bullet points',
    category: 'Career',
    tags: ['career', 'writing'],
    body:
      'Write an inclusive job description for a **{{job_title}}** at {{company_type}}.\n\nResponsibilities: {{responsibilities}}\nMust-have skills: {{must_have}}\nNice-to-have skills: {{nice_to_have}}\nLocation / remote policy: {{location}}\n\nUse plain language, avoid jargon and gendered wording, keep requirements realistic (max 6 must-haves), and end with a short "How to apply" section.',
    notes: '',
  },
];
