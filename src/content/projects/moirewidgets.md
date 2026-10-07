---
# Source: content-source/projects/moirewidgets/project.md
title: MoiréWidgets
subtitle: High-Precision, Passive Tangible Interaction via Moiré Effect.
year: 2024
tags: [research]
order: 1
collaborators: [Adobe Research]
hero: ../../assets/images/projects/moirewidgets/teaser-figure.png
heroAlt: Overview figure showing the processing steps on a slider widget. A user interacts with a slider and then two images of Moire pattern illustrate the image processing steps. In the middle, the figure has images of four widgets and on the right the figure shows an audio controller with an accompanying interface to control music playback.
thumbnail: ../../assets/images/projects/moirewidgets/hand-dial-3.png
thumbnailAlt: Image of a hand holding a white dial with a circular moire pattern and blue outlined. 
gallery:
  - src: ../../assets/images/projects/moirewidgets/samples.png
    alt: Series of 5 images each showing a hand holding each type of widget including a button, joystick, switch, dial, and slider. 
  - src: ../../assets/images/projects/moirewidgets/hand-dial-3.png
    alt: Image of a hand holding a white dial with a circular moire pattern and blue outlined.
  - src: ../../assets/images/projects/moirewidgets/maxresdefault.jpg
    alt: A first-person-view photo of a hand using music controller built with MoiréWidgets that has a button, diall, and slider. The hand is moving the slider as a screenshot of a music controller app on the top-right corner controls the volume. 
links:
  paper: moirewidgets
legacyPaths: [/moirewidgets]
demo: MoireExplorer
---

We introduce MoiréWidgets, a novel approach for tangible interaction that harnesses the Moiré effect—a prevalent optical phenomenon—to enable high-precision event detection on physical widgets. Unlike other electronics-free tangible user interfaces which require close coupling with external hardware, MoiréWidgets can be used at greater distances while maintaining high-resolution sensing of interactions. We define a set of interaction primitives, e.g., buttons, sliders, and dials, which can be used as standalone objects or combined to build complex physical controls. These consist of 3D printed structural mechanisms with patterns printed on two layers—one on paper and the other on a plastic transparency sheet—which create a visual signal that amplifies subtle movements, enabling the detection of user inputs. Our technical evaluation shows that our method outperforms standard fiducial markers and maintains sub-millimeter accuracy at 100 cm distance and wide viewing angles. We demonstrate our approach by creating an audio console and indicate how our approach could extend to other domains.
