INSERT INTO
    users (
        username,
        password_hash,
        name,
        email,
        phone,
        role,
        is_active
    )
VALUES
    (
        'admin',
        '$2a$10$DaRgjQlxjPuFhbBTznhu9eVBYs.g8dp3CHP4lbjWmdlLpq1OT6CSa',
        'Rodney Lingganay',
        'rodentskie@gmail.com',
        '+639978305773',
        'admin',
        true
    );

INSERT INTO
    products (
        name,
        code,
        location,
        price,
        quantity,
        min_threshold
    )
VALUES
    ('Coca Cola', 'CC', 'A-1', 2.50, 20, 5),
    ('Pepsi', 'PP', 'A-2', 2.50, 18, 5),
    ('Water', 'H20', 'A-3', 1.50, 30, 10),
    ('Chips', 'CHP', 'B-1', 3.00, 15, 5),
    ('Chocolate Bar', 'CB', 'B-2', 2.75, 12, 5);