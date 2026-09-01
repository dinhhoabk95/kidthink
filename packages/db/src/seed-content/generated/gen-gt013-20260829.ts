/**
 * @generated from LEVEL-GENERATOR-KIT@57ed24be0eda
 * Engine: GT-013
 * Seed: 20260829
 * Theme: school
 * Band: 4-5
 * Total generated: 1
 */
import type { ContentSeed } from "#src/seed-content/types";

export const GEN_GT013_20260829: ContentSeed<unknown, unknown>[] = [
  {
    "header": {
      "code": "GL-GEN-GT-013-20260829-01",
      "content_version": 1,
      "template_code": "GT-013",
      "title": "",
      "instruction": "",
      "age_min": 4,
      "age_max": 5,
      "difficulty": 1,
      "access_tier": "free",
      "skill_codes": [],
      "learning_objective_codes": [],
      "what_tags": [],
      "thinking_tags": [],
      "theme_tag": "school",
      "origin": "ai_assisted",
      "authored_in": "repo_seed"
    },
    "content_pack": {
      "prompt": "Bé hãy vẽ đường đi giúp bạn vượt qua mê cung nhé!",
      "grid": {
        "rows": 4,
        "cols": 4,
        "walls": [
          {
            "row": 0,
            "col": 1,
            "side": "s"
          },
          {
            "row": 1,
            "col": 2,
            "side": "e"
          },
          {
            "row": 2,
            "col": 1,
            "side": "w"
          }
        ],
        "start": {
          "row": 0,
          "col": 0
        },
        "goal": {
          "row": 3,
          "col": 3
        }
      },
      "required_cells": [],
      "input_mode": "draw"
    },
    "difficulty_params": {
      "dead_end_count": 1,
      "required_cell_count": 0,
      "hint_after_ms": 10000,
      "allow_retry": true
    }
  }
];
