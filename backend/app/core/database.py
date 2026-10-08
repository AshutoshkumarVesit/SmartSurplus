"""
In-memory data store with seed data for SmartSurplus demo.
All data is stored in Python dicts and resets on server restart.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from app.core.auth import hash_password


class InMemoryDB:
    def __init__(self):
        self.users = {}          # id -> user dict
        self.food_data = {}      # id -> food entry dict
        self.predictions = {}    # id -> prediction dict
        self.matches = {}        # id -> match dict
        self.redistribution_logs = []
        self._seed()

    def _uid(self) -> str:
        return str(uuid.uuid4())[:8]

    def _now(self) -> str:
        return datetime.utcnow().isoformat()

    # ========== Users ==========
    def add_user(self, user_data: dict) -> dict:
        uid = self._uid()
        user = {
            "id": uid,
            **user_data,
            "password": hash_password(user_data["password"]),
            "created_at": self._now(),
        }
        self.users[uid] = user
        return user

    def get_user_by_username(self, username: str) -> Optional[dict]:
        for u in self.users.values():
            if u["username"] == username:
                return u
        return None

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return self.users.get(user_id)

    def get_users_by_role(self, role: str) -> List[dict]:
        return [u for u in self.users.values() if u["role"] == role]

    def get_all_users(self) -> List[dict]:
        return list(self.users.values())

    # ========== Food Data ==========
    def add_food_data(self, provider_id: str, data: dict) -> dict:
        fid = self._uid()
        provider = self.users.get(provider_id, {})
        entry = {
            "id": fid,
            "provider_id": provider_id,
            "provider_name": provider.get("name", "Unknown"),
            **data,
            "prepared_at": data.get("prepared_at") or self._now(),
            "created_at": self._now(),
        }
        self.food_data[fid] = entry
        return entry

    def get_food_data_by_provider(self, provider_id: str) -> List[dict]:
        return [f for f in self.food_data.values() if f["provider_id"] == provider_id]

    def get_all_food_data(self) -> List[dict]:
        return list(self.food_data.values())

    # ========== Predictions ==========
    def add_prediction(self, data: dict) -> dict:
        pid = self._uid()
        prediction = {"id": pid, **data, "predicted_at": self._now()}
        self.predictions[pid] = prediction
        return prediction

    def get_predictions_by_provider(self, provider_id: str) -> List[dict]:
        return [p for p in self.predictions.values() if p["provider_id"] == provider_id]

    def get_all_predictions(self) -> List[dict]:
        return list(self.predictions.values())

    # ========== Matches ==========
    def add_match(self, data: dict) -> dict:
        mid = self._uid()
        match = {"id": mid, **data, "status": "pending", "created_at": self._now()}
        self.matches[mid] = match
        return match

    def get_match_by_id(self, match_id: str) -> Optional[dict]:
        return self.matches.get(match_id)

    def get_matches_by_ngo(self, ngo_id: str) -> List[dict]:
        return [m for m in self.matches.values() if m["ngo_id"] == ngo_id]

    def get_matches_by_provider(self, provider_id: str) -> List[dict]:
        return [m for m in self.matches.values() if m["provider_id"] == provider_id]

    def get_all_matches(self) -> List[dict]:
        return list(self.matches.values())

    def update_match_status(self, match_id: str, status: str) -> Optional[dict]:
        if match_id in self.matches:
            self.matches[match_id]["status"] = status
            return self.matches[match_id]
        return None

    # ========== Logs ==========
    def add_log(self, log_data: dict):
        self.redistribution_logs.append({**log_data, "timestamp": self._now()})

    def get_logs(self) -> List[dict]:
        return self.redistribution_logs

    # ========== Seed Data ==========
    def _seed(self):
        """Populate with realistic demo data."""
        # --- Admin ---
        self.add_user({
            "username": "admin", "password": "admin123", "email": "admin@smartsurplus.com",
            "role": "admin", "name": "System Admin", "phone": "9999999999",
            "address": "SmartSurplus HQ, Mumbai", "latitude": 19.076, "longitude": 72.8777,
            "cuisine_type": None, "provider_type": None, "capacity": None,
        })

        # --- Providers ---
        providers = [
            {"username": "tajhotel", "name": "Taj Palace Kitchen", "email": "taj@hotel.com",
             "provider_type": "restaurant", "cuisine_type": "Indian Multi-Cuisine",
             "latitude": 18.9220, "longitude": 72.8347, "address": "Colaba, Mumbai"},
            {"username": "cloudchef", "name": "CloudChef Express", "email": "cloud@chef.com",
             "provider_type": "cloud_kitchen", "cuisine_type": "North Indian",
             "latitude": 19.0176, "longitude": 72.8562, "address": "Dadar, Mumbai"},
            {"username": "campusmess", "name": "IIT Bombay Hostel Mess", "email": "mess@iitb.com",
             "provider_type": "hostel", "cuisine_type": "South Indian / North Indian",
             "latitude": 19.1334, "longitude": 72.9133, "address": "Powai, Mumbai"},
            {"username": "royalbanquet", "name": "Royal Banquet Hall", "email": "royal@banquet.com",
             "provider_type": "event", "cuisine_type": "Multi-Cuisine",
             "latitude": 19.0596, "longitude": 72.8295, "address": "Bandra, Mumbai"},
            {"username": "spiceroad", "name": "Spice Road Restaurant", "email": "spice@road.com",
             "provider_type": "restaurant", "cuisine_type": "South Indian",
             "latitude": 19.0825, "longitude": 72.8890, "address": "Kurla, Mumbai"},
            {"username": "megaevent", "name": "Mega Events Co.", "email": "info@megaevent.com",
             "provider_type": "event", "cuisine_type": "International",
             "latitude": 19.1073, "longitude": 72.8371, "address": "Andheri, Mumbai"},
            {"username": "greenplate", "name": "Green Plate Café", "email": "green@plate.com",
             "provider_type": "restaurant", "cuisine_type": "Continental",
             "latitude": 19.1197, "longitude": 72.9051, "address": "Vikhroli, Mumbai"},
            {"username": "unityhostel", "name": "Unity University Hostel", "email": "unity@hostel.com",
             "provider_type": "hostel", "cuisine_type": "North Indian",
             "latitude": 19.0454, "longitude": 72.8893, "address": "Chembur, Mumbai"},
            {"username": "quickbites", "name": "QuickBites Cloud Kitchen", "email": "quick@bites.com",
             "provider_type": "cloud_kitchen", "cuisine_type": "Fast Food",
             "latitude": 19.1760, "longitude": 72.9477, "address": "Mulund, Mumbai"},
            {"username": "grandhotel", "name": "Grand Hyatt Kitchen", "email": "grand@hyatt.com",
             "provider_type": "restaurant", "cuisine_type": "International",
             "latitude": 19.0810, "longitude": 72.8997, "address": "Santacruz, Mumbai"},
            {"username": "festivalfood", "name": "Festival Foods Catering", "email": "fest@food.com",
             "provider_type": "event", "cuisine_type": "Street Food",
             "latitude": 18.9550, "longitude": 72.8353, "address": "Fort, Mumbai"},
            {"username": "homestyle", "name": "HomeStyle Tiffin Service", "email": "home@tiffin.com",
             "provider_type": "cloud_kitchen", "cuisine_type": "Maharashtrian",
             "latitude": 19.0330, "longitude": 72.8411, "address": "Lower Parel, Mumbai"},
            {"username": "campuseat", "name": "Mumbai Uni Canteen", "email": "canteen@mu.edu",
             "provider_type": "hostel", "cuisine_type": "Mixed",
             "latitude": 19.0728, "longitude": 72.8326, "address": "Santacruz West, Mumbai"},
            {"username": "wokexpress", "name": "Wok Express", "email": "wok@express.com",
             "provider_type": "cloud_kitchen", "cuisine_type": "Chinese/Asian",
             "latitude": 19.1185, "longitude": 72.8614, "address": "Goregaon, Mumbai"},
            {"username": "marriottmum", "name": "JW Marriott Kitchen", "email": "jw@marriott.com",
             "provider_type": "restaurant", "cuisine_type": "Fine Dining",
             "latitude": 19.0632, "longitude": 72.8296, "address": "Juhu, Mumbai"},
        ]

        provider_ids = []
        for p in providers:
            user = self.add_user({
                **p, "password": "pass123", "role": "provider",
                "phone": "98" + str(hash(p["username"]))[-8:].replace("-", "0"),
                "capacity": None,
            })
            provider_ids.append(user["id"])

        # --- NGOs ---
        ngos = [
            {"username": "feedindia", "name": "Feed India Foundation", "email": "feed@india.org",
             "latitude": 19.0500, "longitude": 72.8800, "address": "Sion, Mumbai", "capacity": 500},
            {"username": "robinhood", "name": "Robin Hood Army - Mumbai", "email": "rha@mumbai.org",
             "latitude": 19.0760, "longitude": 72.8450, "address": "Khar, Mumbai", "capacity": 300},
            {"username": "annadan", "name": "Annadan Trust", "email": "anna@dan.org",
             "latitude": 19.0180, "longitude": 72.8430, "address": "Parel, Mumbai", "capacity": 200},
            {"username": "rotibank", "name": "Roti Bank Mumbai", "email": "roti@bank.org",
             "latitude": 19.1070, "longitude": 72.8370, "address": "Andheri East, Mumbai", "capacity": 400},
            {"username": "akshayapatra", "name": "Akshaya Patra Foundation", "email": "akshaya@patra.org",
             "latitude": 19.1400, "longitude": 72.8300, "address": "Borivali, Mumbai", "capacity": 1000},
            {"username": "mealsonwheels", "name": "Meals on Wheels India", "email": "meals@wheels.in",
             "latitude": 18.9400, "longitude": 72.8350, "address": "Churchgate, Mumbai", "capacity": 250},
            {"username": "hopeforhungry", "name": "Hope for the Hungry", "email": "hope@hungry.org",
             "latitude": 19.0650, "longitude": 72.8680, "address": "Mahim, Mumbai", "capacity": 350},
            {"username": "foodforall", "name": "Food For All Society", "email": "food@all.org",
             "latitude": 19.1550, "longitude": 72.9500, "address": "Thane, Mumbai", "capacity": 600},
            {"username": "shelterchef", "name": "Shelter Chef Program", "email": "shelter@chef.org",
             "latitude": 19.0100, "longitude": 72.8600, "address": "Mahalaxmi, Mumbai", "capacity": 150},
            {"username": "karunafund", "name": "Karuna Food Relief", "email": "karuna@fund.org",
             "latitude": 19.0960, "longitude": 72.9100, "address": "Ghatkopar, Mumbai", "capacity": 450},
        ]

        ngo_ids = []
        for n in ngos:
            user = self.add_user({
                **n, "password": "pass123", "role": "ngo",
                "phone": "97" + str(hash(n["username"]))[-8:].replace("-", "0"),
                "cuisine_type": None, "provider_type": None,
            })
            ngo_ids.append(user["id"])

        # --- Historical Food Data ---
        import random
        random.seed(42)

        food_types = [
            ("rice", True, "lunch"), ("dal", True, "lunch"), ("roti", True, "dinner"),
            ("vegetables", True, "lunch"), ("biryani", True, "dinner"),
            ("salad", True, "lunch"), ("bread", False, "breakfast"),
            ("pasta", True, "dinner"), ("sandwiches", False, "breakfast"),
            ("soup", True, "dinner"), ("fruit", True, "breakfast"),
            ("paneer curry", True, "lunch"), ("noodles", True, "dinner"),
            ("idli sambar", True, "breakfast"), ("dosa", True, "breakfast"),
        ]

        for i in range(250):
            provider_id = random.choice(provider_ids)
            food = random.choice(food_types)
            days_ago = random.randint(0, 60)
            hour = random.choice([8, 12, 13, 19, 20])
            base_time = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 5))

            self.add_food_data(provider_id, {
                "food_type": food[0],
                "quantity_kg": round(random.uniform(2.0, 50.0), 1),
                "prepared_at": base_time.isoformat(),
                "expiry_hours": random.choice([3, 4, 6, 8, 12, 24]),
                "is_perishable": food[1],
                "meal_type": food[2],
                "event_type": random.choice([None, None, None, "wedding", "conference", "party"]),
                "notes": None,
            })

        # --- Generate some predictions ---
        import math
        for fd in list(self.food_data.values())[:80]:
            surplus_pct = random.uniform(0.1, 0.6)
            surplus = round(fd["quantity_kg"] * surplus_pct, 1)
            risk = "high" if surplus_pct > 0.4 else ("medium" if surplus_pct > 0.25 else "low")
            confidence = round(random.uniform(0.72, 0.96), 2)

            recs = []
            if risk == "high":
                recs = ["Reduce preparation quantity by 30%", "Schedule early pickup", "Consider menu optimization"]
            elif risk == "medium":
                recs = ["Monitor serving patterns", "Plan redistribution 2 hours before closing"]
            else:
                recs = ["Current preparation levels are near-optimal"]

            pred = self.add_prediction({
                "provider_id": fd["provider_id"],
                "provider_name": fd["provider_name"],
                "food_id": fd["id"],
                "food_type": fd["food_type"],
                "predicted_surplus_kg": surplus,
                "actual_quantity_kg": fd["quantity_kg"],
                "waste_risk": risk,
                "confidence": confidence,
                "recommendations": recs,
            })

            # Create matches for high/medium risk predictions
            if risk in ("high", "medium") and random.random() > 0.3:
                ngo_id = random.choice(ngo_ids)
                ngo = self.users[ngo_id]
                provider = self.users.get(fd["provider_id"], {})

                # Rough distance calculation
                lat1, lon1 = provider.get("latitude", 19.07), provider.get("longitude", 72.87)
                lat2, lon2 = ngo.get("latitude", 19.07), ngo.get("longitude", 72.87)
                dist = round(math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2) * 111, 1)  # rough km

                urgency = round(10 - (fd.get("expiry_hours", 6) / 2.4), 1)
                urgency = max(1, min(10, urgency))
                priority = round((urgency * surplus) / max(dist, 0.5), 2)

                status = random.choice(["pending", "accepted", "picked_up", "delivered", "delivered"])
                self.add_match({
                    "prediction_id": pred["id"],
                    "provider_id": fd["provider_id"],
                    "provider_name": fd["provider_name"],
                    "ngo_id": ngo_id,
                    "ngo_name": ngo["name"],
                    "food_type": fd["food_type"],
                    "quantity_kg": surplus,
                    "distance_km": dist,
                    "urgency_score": urgency,
                    "priority_score": priority,
                })
                self.matches[list(self.matches.keys())[-1]]["status"] = status

                if status == "delivered":
                    self.add_log({
                        "match_id": list(self.matches.keys())[-1],
                        "provider_name": fd["provider_name"],
                        "ngo_name": ngo["name"],
                        "food_type": fd["food_type"],
                        "quantity_kg": surplus,
                        "action": "delivered",
                    })


# Singleton instance
db = InMemoryDB()
