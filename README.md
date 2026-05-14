# 2b2m Misc

Public 2b2m utility repository for static web files and the MPUC update feed.

## Update Feed

Raw feed base URL:

```text
https://raw.githubusercontent.com/2b2m-org/2b2m-misc/main/2b2m-update-feed/
```

Use this mod config:

```json
{
  "updateCheckerId": "https://raw.githubusercontent.com/2b2m-org/2b2m-misc/main/2b2m-update-feed/",
  "advanced": {
    "updateCheckerType": 2
  }
}
```

The URL must end with `/` because the mod appends `meta.json` and
`versions/<version>/changelog.txt`.

Current feed files:

- `2b2m-update-feed/meta.json`
- `2b2m-update-feed/versions/1.2.1/changelog.txt`
- `2b2m-update-feed/versions/1.3.0/changelog.txt`
- `2b2m-update-feed/versions/1.3.1/changelog.txt`

## Web Page

GitHub Pages serves the static React page from the repository root:

```text
https://2b2m-org.github.io/2b2m-misc/
```

The page is plain static HTML, CSS, and browser-loaded React. Future public API
calls should use HTTPS endpoints with CORS enabled for the Pages origin.
