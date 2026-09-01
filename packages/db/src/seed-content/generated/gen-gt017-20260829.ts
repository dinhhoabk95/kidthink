/**
 * @generated from LEVEL-GENERATOR-KIT@57ed24be0eda
 * Engine: GT-017
 * Seed: 20260829
 * Theme: school
 * Band: 4-5
 * Total generated: 1
 */
import type { ContentSeed } from "#src/seed-content/types";

export const GEN_GT017_20260829: ContentSeed<unknown, unknown>[] = [
  {
    "header": {
      "code": "GL-GEN-GT-017-20260829-01",
      "content_version": 1,
      "template_code": "GT-017",
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
      "prompt": "Bé hãy đếm xem có tất cả bao nhiêu khối lập phương nhé! (Có 3 khối)",
      "model": [
        {
          "x": 0,
          "y": 0,
          "z": 0
        },
        {
          "x": 1,
          "y": 0,
          "z": 0
        },
        {
          "x": 0,
          "y": 0,
          "z": 1
        }
      ],
      "question": "count_cubes",
      "options": [
        {
          "option_id": "opt_correct",
          "asset": {
            "kind": "emoji",
            "ref": "EMJ-star"
          },
          "is_correct": true
        },
        {
          "option_id": "opt_dist_1",
          "asset": {
            "kind": "emoji",
            "ref": "EMJ-circle"
          },
          "is_correct": false
        },
        {
          "option_id": "opt_dist_2",
          "asset": {
            "kind": "emoji",
            "ref": "EMJ-triangle"
          },
          "is_correct": false
        }
      ]
    },
    "difficulty_params": {
      "hidden_cube_count": 0,
      "distractor_count": 2,
      "allow_rotate": false,
      "hint_after_ms": 10000,
      "allow_retry": true
    }
  }
];
