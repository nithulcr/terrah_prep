# Terrah Prep data model

The application uses only these Supabase tables: `profiles`, `subscriptions`, `plans`, `batches`, `categories`, and `questions`.

Questions contain `option_a`, `option_b`, `option_c`, `option_d`, and `correct_option` directly. A question belongs to a batch through `batch_id` and a category through `category_id`.

The user-facing practice flow lists active batches and loads active questions by `batch_id`. Results are computed in the browser and are not persisted because no attempts or answer tables exist in this schema.
