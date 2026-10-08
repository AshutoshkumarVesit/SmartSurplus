"""
Analytics Service - Computes system-wide statistics for admin dashboard.
"""
from app.core.database import db


def compute_system_stats() -> dict:
    """Compute aggregate system statistics."""
    providers = db.get_users_by_role("provider")
    ngos = db.get_users_by_role("ngo")
    all_food = db.get_all_food_data()
    all_predictions = db.get_all_predictions()
    all_matches = db.get_all_matches()

    delivered = [m for m in all_matches if m.get("status") == "delivered"]
    active = [m for m in all_matches if m.get("status") in ("pending", "accepted", "picked_up")]

    total_waste_saved = sum(m.get("quantity_kg", 0) for m in delivered)

    # Calculate average prediction accuracy (simulated)
    accuracies = []
    for pred in all_predictions:
        predicted = pred.get("predicted_surplus_kg", 0)
        actual = pred.get("actual_quantity_kg", 1)
        if actual > 0:
            acc = 1 - abs(predicted - actual * 0.3) / actual  # Simulated accuracy
            accuracies.append(max(0, min(1, acc)))

    avg_accuracy = round(sum(accuracies) / max(len(accuracies), 1), 2)

    return {
        "total_providers": len(providers),
        "total_ngos": len(ngos),
        "total_food_entries": len(all_food),
        "total_predictions": len(all_predictions),
        "total_redistributions": len(all_matches),
        "successful_deliveries": len(delivered),
        "total_waste_saved_kg": round(total_waste_saved, 1),
        "avg_prediction_accuracy": avg_accuracy,
        "active_matches": len(active),
    }
