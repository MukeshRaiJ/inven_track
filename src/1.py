import random
from faker import Faker
import psycopg2
from decimal import Decimal

fake = Faker()

DATABASE_URL = "postgresql://postgres:PostgreSQL@localhost:5433/inventory_db"

shoe_brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Asics', 'Converse', 'Vans', 'Under Armour']
shoe_types = ['Running', 'Basketball', 'Casual', 'Training', 'Tennis', 'Hiking', 'Skateboarding', 'Walking']
sizes = list(range(6, 14))  # Common shoe sizes 6-13

def generate_shoe_name():
    brand = random.choice(shoe_brands)
    shoe_type = random.choice(shoe_types)
    model_number = random.randint(1000, 9999)
    return f"{brand} {shoe_type} {model_number}"

def generate_sample_data(num_records):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for _ in range(num_records):
            name = generate_shoe_name()
            quantity = random.randint(0, 200)
            price = round(Decimal(random.uniform(39.99, 299.99)), 2)
            category = random.choice(shoe_types)
            
            cur.execute("""
                INSERT INTO products (name, quantity, price, category)
                VALUES (%s, %s, %s, %s)
            """, (name, quantity, price, category))
            
        conn.commit()
        print(f"Generated {num_records} shoe records")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    generate_sample_data(10000)