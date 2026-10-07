---
# Source: content-source/projects/robot-gaze/project.md
title: Realistic and Interactive Robot Gaze
subtitle: Layering motor and attention behaviors to achieve the illusion of life through eye contact
year: 2019
tags: [research]
order: 5
collaborators: [Disney Research]
hero: ../../assets/images/projects/robot-gaze/interactive-gaze-01.webp
heroAlt: Over-shoulder image showing a robotic figure with exposed mechanical structures looking at a passerby. 
gallery:
  - src: ../../assets/images/projects/robot-gaze/interactive-gaze-02.jpg
    alt: Close up photo showing the eyes of a mechanial robot. The eyes are realistic and have eye lids, blue pupils while the rest of the face is made of white plastic. 
  - src: ../../assets/images/projects/robot-gaze/realistic-and-interactive-robot-gaze.gif

    alt: Animated gif of the robot blinking and looking at a person across from them, the robot mirrors the persons movements as they tilt their head from side to side. 
# The old page embedded this video in place of an image gallery.
video: https://www.youtube.com/watch?v=D8_VmWWRJgE
links:
  paper: robot-gaze
legacyPaths: [/lifelike-robot-gaze]
---

This paper describes the development of a system for lifelike gaze in human-robot interactions using a humanoid Audio-Animatronics® bust. Previous work examining mutual gaze between robots and humans has focused on technical implementation. We present a general architecture that seeks not only to create gaze interactions from a technological standpoint, but also through the lens of character animation where the fidelity and believability of motion is paramount; that is, we seek to create an interaction which demonstrates the illusion of life. A complete system is described that perceives persons in the environment, identifies persons-of-interest based on salient actions, selects an appropriate gaze behavior, and executes high, fidelity motions to respond to the stimuli. We use mechanisms that mimic motor and attention behaviors analogous to those observed in biological systems including attention habituation, saccades, and differences in motion bandwidth for actuators. Additionally, a subsumption architecture allows layering of simple motor movements to create increasingly complex behaviors which are able to interactively and realistically react to salient stimuli in the environment through subsuming lower levels of behavior. The result of this system is an interactive human-robot experience capable of human-like gaze behaviors.
