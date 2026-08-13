# Contributing to the website — a guide for Tom

This site is a handful of simple files (no complicated system to learn). You don't need to know how to code — you just tell Claude Code what you want changed in plain English, and it edits the files for you.

Here's the loop:

1. **Claude Code** — an AI assistant that edits the website's files when you describe what you want.
2. **GitHub Desktop** — a simple app that sends your changes live once you're happy with them.
3. **Vercel** — updates the live website automatically whenever changes are sent (nothing you need to do here).

## One-time setup

You only need to do this once.

### 1. Get access to the project

Ask Steve to add your GitHub account as a collaborator on the repository (`stevejwikeley/tom-the-chiropractor`). If you don't have a GitHub account yet, create a free one at [github.com](https://github.com) first, then send Steve the username.

### 2. Install GitHub Desktop

1. Download it from [desktop.github.com](https://desktop.github.com) and install it.
2. Open it and sign in with your GitHub account.
3. Go to **File → Clone Repository**, find **tom-the-chiropractor** in the list, choose a folder on your computer to save it in (e.g. your Documents folder), and click **Clone**.

You now have a copy of the website's files on your computer.

### 3. Install Claude Code

1. Go to [claude.com/claude-code](https://claude.com/claude-code) and download the desktop app for your computer (Mac or Windows).
2. Install it and sign in with your Claude account. You'll need a plan that includes Claude Code (Pro or Max) — the site will guide you through this if you don't have one yet.

## Making a change

Every time you want to update something on the site:

1. **Open Claude Code** and open the project folder you cloned in step 2 above.
2. **Type what you want, in plain English.** For example:
   - "Change the initial consultation price to £80"
   - "Add a new FAQ question about how long appointments take"
   - "Change the WhatsApp number to 07123 456789"
   - "Update the opening hours to include Friday evenings"
3. Claude Code will make the change. Ask it to **"show me what that looks like"** and it'll open a preview in a browser so you can check it before going any further.
4. Not quite right? Just describe what to fix — "make that heading bigger" or "actually keep the old wording for that bit" — and it'll adjust it.

## Publishing your changes (going live)

Nothing is live on the actual website until you publish it. This is deliberate — it means you can experiment freely and nothing breaks until you're ready.

1. Open **GitHub Desktop**. It'll list the files Claude Code changed.
2. In the box at the bottom left, write a short note about what changed (e.g. "Updated prices").
3. Click **Commit to main**.
4. Click **Push origin** at the top.

That's it. The live website updates automatically within a minute or two — Vercel is already connected to this project and handles that part for you.

**Live site:** https://tom-the-chiropractor-website.vercel.app

## If something goes wrong

Nothing is permanently lost — every change you've ever pushed is saved in GitHub Desktop's history, so an earlier version can always be restored. If you're not sure what happened, just ask Claude Code — "something looks broken, can you check?" — or ask Steve.

## Editing a lot of text at once

The file `content/site-copy.json` lists most of the website's text in one place, which can be easier to work through than asking for changes one at a time. Open it, edit the wording however you like, save it, then tell Claude Code: *"I've updated content/site-copy.json, can you update the website to match?"*

## Things you don't need to worry about

- **The design or code structure.** Claude Code already understands how this site is built and will keep anything new consistent with the current look and feel.
- **Breaking something by accident.** You always get a preview before anything is published, and every past version is recoverable.
