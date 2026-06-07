-- HUD status: pending (just created) → published (approved) | rejected | archived
ALTER TABLE show_hud
    ADD COLUMN IF NOT EXISTS status ENUM('pending','published','rejected','archived')
    NOT NULL DEFAULT 'pending'
    AFTER cover;

-- Event status: same lifecycle
ALTER TABLE show_event
    ADD COLUMN IF NOT EXISTS status ENUM('pending','published','rejected','archived')
    NOT NULL DEFAULT 'pending'
    AFTER max_price;
