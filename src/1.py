import random
from datetime import datetime, timedelta
import psycopg2
from faker import Faker

# Initialize Faker
fake = Faker()

# Database connection string
DATABASE_URL = "postgresql://postgres:PostgreSQL@localhost:5433/inventory_db"

# Brand categories mapping
BRAND_CATEGORIES = {
    'Nike': ['Running', 'Basketball', 'Training'],
    'Adidas': ['Running', 'Basketball', 'Casual', 'Training', 'Tennis'],
    'Puma': ['Running', 'Basketball', 'Casual', 'Training'],
    'Reebok': ['Running', 'Basketball'],
    'ASICS': ['Running', 'Tennis'],
    'Skechers': ['Running', 'Walking'],
    'Campus': ['Running', 'Walking'],
    'Bata': ['Casual', 'Walking'],
    'Liberty': ['Casual', 'Walking'],
    'Woodland': ['Casual', 'Hiking'],
    'Red Chief': ['Casual', 'Hiking'],
    'HRX': ['Running', 'Training', 'Skateboarding'],
    'Wildcraft': ['Hiking'],
    'Quechua': ['Hiking'],
    'Vans': ['Skateboarding'],
    'Sparx': ['Training', 'Skateboarding']
}

COLORS = ['Black', 'White', 'Grey', 'Navy', 'Red', 'Blue', 'Green', 'Brown', 'Tan', 'Multi']
GENDER_OPTIONS = ['Men', 'Women', 'Unisex']
GENDER_WEIGHTS = [0.45, 0.45, 0.1]

def generate_style_code():
    """Generate a unique style code in format: BRD-CAT-XXXX"""
    return f"{''.join(fake.random_letters(length=3)).upper()}-{''.join(fake.random_letters(length=2)).upper()}-{fake.random_number(digits=4)}"

def generate_model_name(brand, category, attempt=0):
    """Generate a realistic model name based on brand and category"""
    descriptors = {
        'Running': ['Zoom', 'Air', 'Boost', 'Swift', 'Rapid', 'Flow', 'Race', 'Speed', 'Dash', 'Sprint'],
        'Basketball': ['Pro', 'Jump', 'Court', 'Elite', 'Power', 'Force', 'Dunk', 'Slam', 'Hoop', 'Game'],
        'Casual': ['Classic', 'Urban', 'Street', 'Daily', 'Comfort', 'Easy', 'Lite', 'Style', 'Fashion', 'Trend'],
        'Training': ['Trainer', 'Flex', 'Core', 'Performance', 'Active', 'Dynamic', 'Power', 'Energy', 'Fit', 'Pro'],
        'Tennis': ['Court', 'Match', 'Ace', 'Game', 'Rally', 'Serve', 'Net', 'Set', 'Point', 'Play'],
        'Hiking': ['Trail', 'Trek', 'Hike', 'Mountain', 'Peak', 'Alpine', 'Summit', 'Rock', 'Path', 'Adventure'],
        'Skateboarding': ['Skate', 'Board', 'Street', 'Flip', 'Deck', 'Slide', 'Grind', 'Roll', 'Park', 'Ride'],
        'Walking': ['Walk', 'Step', 'Stride', 'Path', 'Move', 'Go', 'Journey', 'Cruise', 'Tour', 'Pace']
    }
    
    descriptor = random.choice(descriptors.get(category, ['Basic']))
    number = str(random.randint(1, 999)) if random.random() > 0.3 else ''
    series = random.choice(['X', 'Z', 'S', 'V', 'Pro', 'Plus', 'Max', '']) if random.random() > 0.5 else ''
    version = str(random.randint(1, 5)) if random.random() > 0.7 else ''
    
    # Add attempt number to ensure uniqueness in case of conflicts
    if attempt > 0:
        number = f"{attempt:03d}"
    
    return f"{descriptor} {series} {number} {version}".strip()

def clear_existing_data(conn, cur):
    """Clear all existing data from tables"""
    tables = ['inventory_transactions', 'inventory', 'products', 'sizes']
    for table in tables:
        cur.execute(f"TRUNCATE TABLE {table} CASCADE")
    conn.commit()

def create_products_data(num_products=1000):
    """Generate products data"""
    products = []
    used_style_codes = set()
    used_model_names = set()
    attempts = 0
    
    for i in range(num_products):
        if i > 0 and i % 100 == 0:
            print(f"Generated {i} products...")
            
        brand = random.choice(list(BRAND_CATEGORIES.keys()))
        category = random.choice(BRAND_CATEGORIES[brand])
        
        # Generate unique style code
        style_code = generate_style_code()
        while style_code in used_style_codes:
            style_code = generate_style_code()
            attempts += 1
            if attempts > 1000:
                print("Warning: Too many attempts to generate unique style code")
                attempts = 0
        used_style_codes.add(style_code)
        
        # Generate unique model name with attempt number to ensure uniqueness
        model_name = generate_model_name(brand, category, attempts)
        model_key = f"{brand}-{model_name}"
        attempts = 0
                
        product = {
            'brand_name': brand,
            'model_name': model_name,
            'style_code': style_code,
            'category': category,
            'color': random.choice(COLORS),
            'gender': random.choices(GENDER_OPTIONS, weights=GENDER_WEIGHTS)[0],
            'retail_price': round(random.uniform(999, 9999), 2),
            'created_at': fake.date_time_between(
                start_date='-1y',
                end_date='now'
            )
        }
        products.append(product)
    return products

def create_sizes_data():
    """Generate sizes data with DECIMAL(4,1) precision"""
    sizes = []
    width_types = ['Narrow', 'Regular', 'Wide']
    uk_sizes = [x / 2 for x in range(8, 26)]  # Generate sizes from 4.0 to 12.5
    
    for uk_size in uk_sizes:
        for width in width_types:
            # Men's sizes
            sizes.append({
                'uk_size': round(uk_size, 1),
                'india_size': round(uk_size, 1),
                'width_type': width,
                'gender': 'Men'
            })
            # Women's sizes
            sizes.append({
                'uk_size': round(uk_size, 1),
                'india_size': round(uk_size, 1),
                'width_type': width,
                'gender': 'Women'
            })
    return sizes

def create_inventory_data(products_with_ids, sizes_with_ids, min_quantity=0, max_quantity=100):
    """Generate inventory data with unique product_id, size_id combinations"""
    inventory = []
    used_combinations = set()
    
    # Create inventory entries for each product with appropriate sizes
    for (product, product_id) in products_with_ids:
        # Filter sizes based on gender
        valid_sizes = [
            (size, size_id) for (size, size_id) in sizes_with_ids 
            if size['gender'] == product['gender'] 
            or product['gender'] == 'Unisex' 
            or size['gender'] == 'Unisex'
        ]
        
        # Randomly select a subset of sizes for each product
        num_sizes = random.randint(len(valid_sizes) // 3, len(valid_sizes))
        selected_sizes = random.sample(valid_sizes, num_sizes)
        
        for (size, size_id) in selected_sizes:
            if (product_id, size_id) not in used_combinations:
                used_combinations.add((product_id, size_id))
                quantity = random.randint(min_quantity, max_quantity)
                min_stock = random.randint(3, 10)
                
                inventory.append({
                    'product_id': product_id,
                    'size_id': size_id,
                    'quantity': quantity,
                    'min_stock_level': min_stock,
                    'last_updated': fake.date_time_between(
                        start_date='-6m',
                        end_date='now'
                    )
                })
    return inventory

def create_inventory_transactions(inventory_ids, num_transactions=10000):
    """Generate inventory transactions data"""
    transactions = []
    transaction_types = ['IN', 'OUT', 'ADJUSTMENT']
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)  # Extended to 1 year of history
    
    for _ in range(num_transactions):
        inventory_id = random.choice(inventory_ids)
        trans_type = random.choice(transaction_types)
        
        if trans_type == 'IN':
            quantity = random.randint(5, 100)  # Increased range
        elif trans_type == 'OUT':
            quantity = random.randint(-50, -1)  # Increased range
        else:  # ADJUSTMENT
            quantity = random.randint(-10, 10)  # Increased range
            
        transaction_date = fake.date_time_between(
            start_date=start_date,
            end_date=end_date
        )
        
        transactions.append({
            'inventory_id': inventory_id,
            'transaction_type': trans_type,
            'quantity': quantity,
            'transaction_date': transaction_date,
            'notes': fake.text(max_nb_chars=50) if random.random() > 0.7 else None
        })
    
    return sorted(transactions, key=lambda x: x['transaction_date'])

def insert_data_to_db():
    """Insert generated data into the database"""
    conn_params = {
        'dbname': DATABASE_URL.split('/')[-1],
        'user': DATABASE_URL.split('://')[1].split(':')[0],
        'password': DATABASE_URL.split(':')[2].split('@')[0],
        'host': DATABASE_URL.split('@')[1].split(':')[0],
        'port': DATABASE_URL.split(':')[3].split('/')[0]
    }
    
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    
    try:
        # Clear existing data
        print("Clearing existing data...")
        clear_existing_data(conn, cur)
        
        # Generate and insert products first
        print("Generating products...")
        products = create_products_data(1000)
        
        print("Inserting products...")
        product_ids = []
        for product in products:
            cur.execute("""
                INSERT INTO products (brand_name, model_name, style_code, category, 
                                    color, gender, retail_price, created_at)
                VALUES (%(brand_name)s, %(model_name)s, %(style_code)s, %(category)s,
                        %(color)s, %(gender)s, %(retail_price)s, %(created_at)s)
                RETURNING product_id
            """, product)
            product_ids.append(cur.fetchone()[0])
        
        print("Generating sizes...")
        sizes = create_sizes_data()
        
        print("Inserting sizes...")
        size_ids = []
        for size in sizes:
            cur.execute("""
                INSERT INTO sizes (uk_size, india_size, width_type, gender)
                VALUES (%(uk_size)s, %(india_size)s, %(width_type)s, %(gender)s)
                RETURNING size_id
            """, size)
            size_ids.append(cur.fetchone()[0])
        
        print("Generating inventory...")
        # Pass products with their actual IDs
        inventory = create_inventory_data(list(zip(products, product_ids)), list(zip(sizes, size_ids)))
        
        print("Inserting inventory...")
        inventory_ids = []  # Store actual inventory IDs
        for inv in inventory:
            cur.execute("""
                INSERT INTO inventory (product_id, size_id, quantity, min_stock_level, last_updated)
                VALUES (%(product_id)s, %(size_id)s, %(quantity)s, %(min_stock_level)s, %(last_updated)s)
                RETURNING inventory_id
            """, inv)
            inventory_ids.append(cur.fetchone()[0])
        
        print("Generating transactions...")
        transactions = create_inventory_transactions(inventory_ids, 10000)  # Pass actual inventory IDs
        
        print("Inserting transactions...")
        for trans in transactions:
            cur.execute("""
                INSERT INTO inventory_transactions (inventory_id, transaction_type,
                                                  quantity, transaction_date, notes)
                VALUES (%(inventory_id)s, %(transaction_type)s, %(quantity)s,
                        %(transaction_date)s, %(notes)s)
            """, trans)
        
        conn.commit()
        print("Data insertion completed successfully!")
        print(f"Inserted {len(products)} products")
        print(f"Inserted {len(sizes)} sizes")
        print(f"Inserted {len(inventory)} inventory records")
        print(f"Inserted {len(transactions)} transactions")
        
    except Exception as e:
        conn.rollback()
        print(f"Error occurred: {e}")
        
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_data_to_db()