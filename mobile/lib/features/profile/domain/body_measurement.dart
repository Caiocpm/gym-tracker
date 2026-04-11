// lib/features/profile/domain/body_measurement.dart

class BodyMeasurement {
  final String id;
  final String date; // YYYY-MM-DD

  // Circunferências gerais (cm)
  final double? weight;
  final double? height;
  final double? waist;
  final double? hip;
  final double? chest;
  final double? neck;
  final double? shoulder;

  // Membros bilaterais (cm)
  final double? armRelaxedRight;
  final double? armRelaxedLeft;
  final double? armFlexRight;
  final double? armFlexLeft;
  final double? forearmRight;
  final double? forearmLeft;
  final double? thighRight;
  final double? thighLeft;
  final double? calfRight;
  final double? calfLeft;

  // Pollock 7 dobras (mm)
  final double? skinfoldChest;
  final double? skinfoldAxillary;
  final double? skinfoldTricep;
  final double? skinfoldSubscapular;
  final double? skinfoldAbdominal;
  final double? skinfoldSuprailiac;
  final double? skinfoldThigh;

  // Resultados calculados
  final double? bodyFatPercent;
  final double? leanMassKg;
  final double? fatMassKg;

  final String? sex;
  final int? age;
  final String? note;
  final List<String> photos;

  const BodyMeasurement({
    required this.id,
    required this.date,
    this.weight,
    this.height,
    this.waist,
    this.hip,
    this.chest,
    this.neck,
    this.shoulder,
    this.armRelaxedRight,
    this.armRelaxedLeft,
    this.armFlexRight,
    this.armFlexLeft,
    this.forearmRight,
    this.forearmLeft,
    this.thighRight,
    this.thighLeft,
    this.calfRight,
    this.calfLeft,
    this.skinfoldChest,
    this.skinfoldAxillary,
    this.skinfoldTricep,
    this.skinfoldSubscapular,
    this.skinfoldAbdominal,
    this.skinfoldSuprailiac,
    this.skinfoldThigh,
    this.bodyFatPercent,
    this.leanMassKg,
    this.fatMassKg,
    this.sex,
    this.age,
    this.note,
    this.photos = const [],
  });

  factory BodyMeasurement.fromJson(Map<String, dynamic> j) => BodyMeasurement(
        id:                   j['id'] as String,
        date:                 j['date'] as String,
        weight:               (j['weight'] as num?)?.toDouble(),
        height:               (j['height'] as num?)?.toDouble(),
        waist:                (j['waist'] as num?)?.toDouble(),
        hip:                  (j['hip'] as num?)?.toDouble(),
        chest:                (j['chest'] as num?)?.toDouble(),
        neck:                 (j['neck'] as num?)?.toDouble(),
        shoulder:             (j['shoulder'] as num?)?.toDouble(),
        armRelaxedRight:      (j['armRelaxedRight'] as num?)?.toDouble(),
        armRelaxedLeft:       (j['armRelaxedLeft'] as num?)?.toDouble(),
        armFlexRight:         (j['armFlexRight'] as num?)?.toDouble(),
        armFlexLeft:          (j['armFlexLeft'] as num?)?.toDouble(),
        forearmRight:         (j['forearmRight'] as num?)?.toDouble(),
        forearmLeft:          (j['forearmLeft'] as num?)?.toDouble(),
        thighRight:           (j['thighRight'] as num?)?.toDouble(),
        thighLeft:            (j['thighLeft'] as num?)?.toDouble(),
        calfRight:            (j['calfRight'] as num?)?.toDouble(),
        calfLeft:             (j['calfLeft'] as num?)?.toDouble(),
        skinfoldChest:        (j['skinfoldChest'] as num?)?.toDouble(),
        skinfoldAxillary:     (j['skinfoldAxillary'] as num?)?.toDouble(),
        skinfoldTricep:       (j['skinfoldTricep'] as num?)?.toDouble(),
        skinfoldSubscapular:  (j['skinfoldSubscapular'] as num?)?.toDouble(),
        skinfoldAbdominal:    (j['skinfoldAbdominal'] as num?)?.toDouble(),
        skinfoldSuprailiac:   (j['skinfoldSuprailiac'] as num?)?.toDouble(),
        skinfoldThigh:        (j['skinfoldThigh'] as num?)?.toDouble(),
        bodyFatPercent:       (j['bodyFatPercent'] as num?)?.toDouble(),
        leanMassKg:           (j['leanMassKg'] as num?)?.toDouble(),
        fatMassKg:            (j['fatMassKg'] as num?)?.toDouble(),
        sex:                  j['sex'] as String?,
        age:                  (j['age'] as num?)?.toInt(),
        note:                 j['note'] as String?,
        photos:               (j['photos'] as List?)?.cast<String>() ?? [],
      );

  bool get hasPollock7 =>
      skinfoldChest != null &&
      skinfoldAxillary != null &&
      skinfoldTricep != null &&
      skinfoldSubscapular != null &&
      skinfoldAbdominal != null &&
      skinfoldSuprailiac != null &&
      skinfoldThigh != null;

  double get sum7 =>
      (skinfoldChest ?? 0) +
      (skinfoldAxillary ?? 0) +
      (skinfoldTricep ?? 0) +
      (skinfoldSubscapular ?? 0) +
      (skinfoldAbdominal ?? 0) +
      (skinfoldSuprailiac ?? 0) +
      (skinfoldThigh ?? 0);

  double? get bmi {
    if (weight == null || height == null || height! <= 0) return null;
    final hm = height! / 100;
    return weight! / (hm * hm);
  }
}
