"""MkDocs hook: hide right-hand TOC on semconv pages so tables get full width."""


def on_page_markdown(markdown, page, config, files):
    if page.file.src_path.startswith("semconv/"):
        page.meta.setdefault("hide", [])
        if "toc" not in page.meta["hide"]:
            page.meta["hide"].append("toc")
    return markdown
