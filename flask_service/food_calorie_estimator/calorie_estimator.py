def hitung_total_kalori(detected_items, kalori_dict):
    rincian = {}
    total_kalori = 0

    for item in detected_items:
        class_name = item.get("class")  
        kalori = kalori_dict.get(class_name, 0)
        rincian[class_name] = rincian.get(class_name, 0) + kalori
        total_kalori += kalori

    return total_kalori, rincian
