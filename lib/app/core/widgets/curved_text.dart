import 'dart:math' as math;
import 'package:flutter/material.dart';

class CurvedText extends StatelessWidget {
  final String text;
  final TextStyle style;
  final double radius;

  const CurvedText({
    super.key,
    required this.text,
    required this.style,
    this.radius = 90,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(100, 35),
      painter: _CurvedTextPainter(
        text: text,
        style: style,
        radius: radius,
      ),
    );
  }
}

class _CurvedTextPainter extends CustomPainter {
  final String text;
  final TextStyle style;
  final double radius;

  _CurvedTextPainter({
    required this.text,
    required this.style,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final textPainters = <TextPainter>[];

    for (final char in text.characters) {
      final painter = TextPainter(
        text: TextSpan(
          text: char,
          style: style,
        ),
        textDirection: TextDirection.ltr,
      );

      painter.layout();
      textPainters.add(painter);
    }

    final totalWidth = textPainters.fold<double>(
      0,
      (sum, painter) => sum + painter.width,
    );

    double x = -totalWidth / 2;

    final centerX = size.width / 2;
    final centerY = radius;

    for (final painter in textPainters) {
      final charWidth = painter.width;
      final charCenter = x + charWidth / 2;

      final angle = charCenter / radius;

      canvas.save();

      canvas.translate(
        centerX + radius * math.sin(angle),
        centerY - radius * math.cos(angle),
      );

      canvas.rotate(angle);

      painter.paint(
        canvas,
        Offset(
          -charWidth / 2,
          -painter.height / 2,
        ),
      );

      canvas.restore();

      x += charWidth;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
