# Agent Notes
Use your weaver-semconv skill. If you find inaccuracies in the skill or fail to use it correctly, improve it. Any lessons learned about Weaver and Semantic Conventions must be incorporated back into the skill.

## Shell: heredoc limitations
- **Output is truncated after the closing delimiter.** Any commands chained after `EOF` in the same call will run but their output is never shown.
- This causes interleaved/garbled output if the next call runs before the shell finishes flushing.
- **Workaround:** Use `create_file` to write multi-line content. Then reference it (e.g. `--body-file`) in a separate terminal call.
