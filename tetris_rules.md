# Tetris — Rules & Gameplay Guide

> **Source:** Wikipedia / The Tetris Company guidelines  
> **Last updated:** April 15, 2026

---

## Overview

**Tetris** is a puzzle video game created by **Alexey Pajitnov**, a Soviet software engineer, in the mid-1980s while working at the Dorodnitsyn Computing Center of the Academy of Sciences in Moscow. The name combines *"tetra"* (Greek for four) and Pajitnov's favorite sport, *tennis*.

It is one of the best-selling video game franchises of all time, with over **520 million sales** across at least 70 platforms. It was inducted into the **World Video Game Hall of Fame** in 2015.

---

## Objective

Stack falling pieces (tetrominoes) to fill complete **horizontal lines** across the playfield. When a line is completely filled:

- It **disappears**, granting points.
- All blocks above **fall down** one row.

The goal is to **score as many points as possible** without letting the pile of pieces reach the top of the field.

---

## The Playing Field

- A vertical rectangular grid, typically **10 columns × 20 rows**.
- In **Normal mode**, pieces enter from the **top-center** and fall **downward**.
- In **Inverted mode**, pieces enter from the **bottom-center** and rise **upward**.
- The player cannot see beyond the far edge of the visible grid.

---

## The 7 Tetrominoes

Each tetromino is made of **4 connected square blocks**. There are exactly 7 shapes:

| Name    | Shape       | Color (standard) |
|---------|-------------|------------------|
| **I**   | ████        | Cyan             |
| **O**   | ██<br>██    | Yellow           |
| **T**   | ███<br> █   | Purple           |
| **S**   | ·██<br>██·  | Green            |
| **Z**   | ██·<br>·██  | Red              |
| **J**   | █··<br>███  | Blue             |
| **L**   | ··█<br>███  | Orange           |

> Modern Tetris uses a **"bag system"**: all 7 tetrominoes appear once in a random order before the set repeats, ensuring a fair distribution.

---

## Core Mechanics

### Movement
- **Move left / right** — Shift the active piece horizontally.
- **Rotate** — Spin the piece clockwise or counter-clockwise.
- A piece **locks in place** when it touches the bottom of the field or another piece.

### Drops
| Action        | Description                                              |
|---------------|----------------------------------------------------------|
| **Soft Drop** | Accelerates the piece downward; awards bonus points.     |
| **Hard Drop** | Instantly places the piece at its lowest possible position; awards bonus points. |

### Hold
- **Hold** — Reserve the current piece to swap with later. Useful for saving an I-piece for a Tetris clear.
- You can hold once per piece; the swapped-in piece cannot be held again immediately.

### Next Queue
- A **preview queue** displays the upcoming pieces (typically the next 1–6 pieces), allowing strategic planning.

---

## Scoring System

Points scale with the **selected difficulty** — higher difficulty awards more points per line clear. The more lines cleared at once, the higher the reward.

| Line Clear          | Description                                              | Relative Score |
|---------------------|----------------------------------------------------------|----------------|
| **Single**          | 1 line cleared                                           | Low            |
| **Double**          | 2 lines cleared simultaneously                           | Medium         |
| **Triple**          | 3 lines cleared simultaneously                           | High           |
| **Tetris**          | 4 lines cleared at once (using the I-piece)              | Highest        |
| **T-Spin Single**   | 1 line cleared with a T-spin                             | Bonus          |
| **T-Spin Double**   | 2 lines cleared with a T-spin                            | High Bonus     |
| **Perfect Clear**   | All blocks removed from the field after a line clear     | Maximum Bonus  |

- **Soft drop** and **Hard drop** grant extra points proportional to the distance dropped.
- **Combos** (clearing lines on consecutive piece placements) multiply points.

---

## Difficulty Selection

Before starting a match, the player selects a **difficulty level** from 1 to 5. This setting is fixed for the entire match and determines how fast the tetrominoes fall.

| Difficulty | Drop Speed  | Description                                              |
|------------|-------------|----------------------------------------------------------|
| **1**      | Very Slow   | Ideal for beginners. Plenty of time to plan each move.   |
| **2**      | Slow        | Comfortable pace with some mild time pressure.           |
| **3**      | Medium      | Balanced challenge for intermediate players.             |
| **4**      | Fast        | Demanding speed; quick reflexes and planning required.   |
| **5**      | Very Fast   | Expert level. Pieces drop almost instantly.              |

> The difficulty cannot be changed mid-match. Choose wisely before starting!

---

## Game Mode Selection

Before starting a match, the player also selects a **game mode**. This setting is fixed for the entire match.

| Mode         | Description                                                                                 |
|--------------|---------------------------------------------------------------------------------------------|
| **Normal**   | Classic Tetris. Tetrominoes appear at the **top** of the field and fall **downward**.       |
| **Inverted** | Tetrominoes appear at the **bottom** of the field and rise **upward**. Lines are cleared from the top of the stack. |

### Inverted Mode Rules
- Pieces **spawn at the bottom-center** of the field and move **upward**.
- The player still moves pieces **left / right** and **rotates** them normally.
- A piece **locks in place** when it touches the **top** of the field or another piece above it.
- Completed horizontal lines at the **top of the stack** disappear, and blocks below shift upward to fill the gap.
- **Game over** occurs when the accumulated pieces block new pieces from spawning at the bottom (**"bottoming out"**).

> All other rules (scoring, holds, hard/soft drop, difficulty) apply equally in both modes.

---

## Game Over Condition

The game ends when accumulated pieces **block new pieces from entering** the top of the field — this is called **"topping out"**.

> There is no way to win indefinitely: research has proven that any Tetris game will eventually end due to the nature of the Z and S tetrominoes.

---

## Advanced Techniques

### T-Spin
Rotating a **T-piece** into a tight, blocked gap just before it locks in place. Rewards significantly more points than a standard line clear.

- **T-Spin Single** — clears 1 line via T-spin.
- **T-Spin Double** — clears 2 lines via T-spin (most valuable standard move).

### Perfect Clear (All-Clear)
Clearing the **entire playfield** of all blocks following a line clear. Awards a massive point bonus.

### Combo
Clearing at least one line with **consecutive piece placements** (no piece landing without clearing a line). Each consecutive clear multiplies the bonus.

### Back-to-Back
Performing two **high-value** clears (Tetris or T-Spin) consecutively without a standard single/double/triple clear in between. Awards a 1.5× bonus.

---

## Quick Reference

| Action          | Effect                                      |
|-----------------|---------------------------------------------|
| Fill 1 row      | Line cleared, blocks above fall             |
| Fill 4 rows     | **Tetris** — highest standard scoring move  |
| Stack too high (Normal)   | **Game over** — top out                |
| Stack too high (Inverted) | **Game over** — bottom out             |
| Use Hard Drop   | Instant placement + bonus points            |
| Hold a piece    | Save it for later use                       |
| T-Spin          | Bonus points for spinning into a gap        |
| Perfect Clear   | Clear all blocks — maximum bonus            |

---

*Tetris® is a registered trademark of The Tetris Company, LLC.*
