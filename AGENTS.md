# Agent Notes

## Shell: heredoc limitations

- Heredocs work correctly — files are written as expected.
- **Output is truncated after the closing delimiter.** Any commands chained after `EOF` in the same call will run but their output is never shown.
- This causes interleaved/garbled output if the next call runs before the shell finishes flushing.
- **Workaround:** Use `create_file` to write multi-line content. Then reference it (e.g. `--body-file`) in a separate terminal call.
