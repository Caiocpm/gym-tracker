// lib/features/nutrition/data/photo_analyze_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/network/api_exception.dart';

class PhotoFoodItem {
  final String name;
  final double quantity;
  final String unit;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;

  // Editável pelo usuário na review
  double editedQuantity;
  bool selected;

  PhotoFoodItem({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    bool? selected,
  })  : editedQuantity = quantity,
        selected = selected ?? true;

  double get scale => quantity > 0 ? editedQuantity / quantity : 1.0;
  double get scaledCalories => calories * scale;
  double get scaledProtein => protein * scale;
  double get scaledCarbs => carbs * scale;
  double get scaledFat => fat * scale;

  factory PhotoFoodItem.fromJson(Map<String, dynamic> json) => PhotoFoodItem(
        name: json['name'] as String? ?? '',
        quantity: (json['quantity'] as num?)?.toDouble() ?? 100,
        unit: json['unit'] as String? ?? 'g',
        calories: (json['calories'] as num?)?.toDouble() ?? 0,
        protein: (json['protein'] as num?)?.toDouble() ?? 0,
        carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
        fat: (json['fat'] as num?)?.toDouble() ?? 0,
      );
}

class PhotoAnalyzeResult {
  final String meal;
  final List<PhotoFoodItem> items;
  final String? notes;

  const PhotoAnalyzeResult({
    required this.meal,
    required this.items,
    this.notes,
  });

  factory PhotoAnalyzeResult.fromJson(Map<String, dynamic> json) =>
      PhotoAnalyzeResult(
        meal: json['meal'] as String? ?? 'snack',
        items: (json['items'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(PhotoFoodItem.fromJson)
            .toList(),
        notes: json['notes'] as String?,
      );
}

class PhotoAnalyzeService {
  static final PhotoAnalyzeService instance = PhotoAnalyzeService._();
  PhotoAnalyzeService._();

  final _dio = DioClient.instance.dio;

  Future<PhotoAnalyzeResult> analyzePhoto(File imageFile) async {
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);

    // Detect mime type from extension
    final ext = imageFile.path.split('.').last.toLowerCase();
    final mimeType = ext == 'png' ? 'image/png' : 'image/jpeg';

    try {
      final res = await _dio.post(
        '/nutrition/analyze-photo',
        data: {'imageBase64': base64Image, 'mimeType': mimeType},
        options: Options(
          receiveTimeout: const Duration(seconds: 60),
          sendTimeout: const Duration(seconds: 30),
        ),
      );
      return PhotoAnalyzeResult.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      // _ErrorInterceptor wraps ApiException inside DioException.error
      if (e.error is ApiException) {
        throw Exception((e.error as ApiException).message);
      }
      if (e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Tempo limite excedido. Tente com uma foto menor.');
      }
      throw Exception('Erro ao analisar a foto. Tente novamente.');
    } on ApiException catch (e) {
      throw Exception(e.message);
    }
  }
}
