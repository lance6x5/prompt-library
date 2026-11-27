import { createPrompt } from './prompt.js';

/** Five example prompts so the app never opens empty. */
export function seedPrompts(now = Date.now()) {
  const day = 86400000;
  return [
    {
      title: 'Summarize a document',
      category: 'Writing',
      tags: ['summary', 'writing'],
      model: 'claude-sonnet-5-5',
      favorite: true,
      body:
        'Summarize the following {{document_type}} for a **{{audience}}** audience.\n\n' +
        '- Keep it under {{word_limit}} words\n- Lead with the single most important point\n- End with 3 action items\n\n' +
        'Text:\n{{text}}',
      notes: 'Works well for meeting notes and long emails.',
    },
    {
      title: 'Code review checklist',
      category: 'Engineering',
      tags: ['code', 'review'],
      model: 'claude-opus-5-5',
      body:
        'You are a senior {{language}} engineer. Review the code below for:\n\n' +
        '1. Correctness and edge cases\n2. Security issues\n3. Readability and naming\n4. Test coverage gaps\n\n' +
        'Reply with a prioritized list. Quote the exact lines you refer to.\n\n```\n{{code}}\n```',
      notes: '',
    },
    {
      title: 'Explain like I am new to it',
      category: 'Learning',
      tags: ['learning', 'explain'],
      model: '',
      body:
        'Explain **{{topic}}** to someone who is new to it.\n\n' +
        'Use one everyday analogy, then give a short, precise definition, then one common misconception.',
      notes: 'Try with technical or finance topics.',
    },
    {
      title: 'Polite follow-up email',
      category: 'Writing',
      tags: ['email', 'writing'],
      model: 'claude-haiku-5-5',
      body:
        'Write a short, friendly follow-up email to {{recipient_name}} about {{subject}}.\n' +
        'Tone: {{tone}}. Mention that I last reached out on {{last_contact_date}}. Max 120 words.',
      notes: '',
    },
    {
      title: 'Brainstorm product names',
      category: 'Ideas',
      tags: ['brainstorm', 'naming'],
      model: '',
      body:
        'Brainstorm 15 names for a {{product_description}}.\n\n' +
        '> Constraints: easy to spell, available as a .com is a plus, no puns on competitors.\n\n' +
        'Group them by style (descriptive, abstract, playful) and star your top 3.',
      notes: 'Ask for a second round with "more like #N".',
    },
  ].map((p, i) => createPrompt({ ...p, createdAt: now - (5 - i) * day, updatedAt: now - (5 - i) * day }, now));
}
