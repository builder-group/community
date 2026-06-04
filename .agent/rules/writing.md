# Writing Rules

Apply these rules to all prose: comments, READMEs, doc strings, PR descriptions, and commit messages.

## Enforce

- Use a colon to introduce an explanation, elaboration, or list that follows naturally from the preceding clause
- Use a comma or split into two sentences when an em dash would otherwise bridge two independent thoughts
- Use parentheses for brief asides that do not need to interrupt the sentence rhythm
- Write in active voice
- Keep sentences short and direct; one idea per sentence is the default
- Write for future maintainers, not the current session
- Match detail to lasting value: explain non-obvious behavior, constraints, tradeoffs, and risks future readers need
- Do not overstate temporary context, and do not understate durable constraints or compatibility concerns
- End full sentences in paragraphs with periods
- In bullet lists, omit periods for single-sentence bullets, short fragments, labels, and index-style lists; use periods when a bullet contains multiple sentences
- Let `.agent/rules/comments.md` override punctuation for short single-line regular code comments; doc comments use sentence punctuation

## Avoid

- Do not use em dashes (—); replace with a colon, comma, parentheses, or a restructured sentence depending on context
- Do not use filler phrases ("it is worth noting that", "in order to", "as mentioned above")
- Do not pad sentences with hedges that add no information ("basically", "essentially", "simply")

## Examples

### Good

```
This function has two phases: validation and persistence.
```

```
Mutable values (arrays, objects) are copied before storing.
```

```
Eager validation can feel intrusive before the user has finished filling in the form.
```

```
The library works directly without an adapter.
```

### Avoid

```
This function has two phases — validation and persistence.
```

```
Mutable values — arrays, objects — are copied before storing.
```

```
Eager validation can feel intrusive — the user hasn't finished yet.
```
