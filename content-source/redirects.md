# Redirects: old Squarespace paths → new site

Every old URL must land on a real page. Agents: copy each row below into
`legacyPaths` in the matching project's frontmatter and into `redirects`
in astro.config.mjs. All redirects are permanent (301).

## Project pages

| Old path                    | New path                       | Project               |
| --------------------------- | ------------------------------ | --------------------- |
| /moirewidgets               | /projects/moirewidgets/            | MoiréWidgets          |
| /mobiprint                  | /projects/mobiprint/               | MobiPrint             |
| /lifelike-robot-gaze        | /projects/robot-gaze/              | Realistic Robot Gaze  |
| /soft-pneumatic-interfaces  | /projects/soft-robot-interfaces/   | Soft Robot Interfaces |
| /magic-bench                | /projects/magic-bench/             | Magic Bench           |
| /photo-chronicle            | /projects/camera-obscura/          | Camera Obscura        |
| /key-1                      | /projects/bpolite/                 | bPolite               |
| /observation-hive           | /projects/observation-hives/       | Observation Hives     |
| /spirit-racing-systems      | /projects/spirit-racing-systems/   | Spirit Racing Systems |

## Home-page anchors

| Old            | New            |
| -------------- | -------------- |
| /#about-me     | /#about        |
| /#publications | /#publications |
| /#work         | /#projects         |

## Old URLs that should 404 (do not redirect)

- /cart
- /test1/project-three-8zgh7-xjb2h
- /test1/project-six-sz8wl-l7n4y
- any other /test1/ path

## Domain-level

- www.danielcz.xyz → danielcz.xyz (GitHub Pages handles this)
- danielcamposzamora.com/* → danielcz.xyz/* (registrar forward, set at launch)