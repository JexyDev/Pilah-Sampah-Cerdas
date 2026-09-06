import 'package:flutter/material.dart';

class WeightText extends StatelessWidget {
  final double weight;
  final int fractionDigits;
  final TextStyle? style;
  final TextStyle? kgStyle;

  const WeightText(
    this.weight, {
    super.key,
    this.fractionDigits = 1,
    this.style,
    this.kgStyle,
  });

  @override
  Widget build(BuildContext context) {
    final defaultStyle = DefaultTextStyle.of(context).style;
    final baseStyle = style ?? defaultStyle;
    final boldStyle = kgStyle ?? baseStyle.copyWith(fontWeight: FontWeight.bold);

    return RichText(
      text: TextSpan(
        text: '${weight.toStringAsFixed(fractionDigits)} ',
        style: baseStyle,
        children: [
          TextSpan(
            text: 'KG',
            style: boldStyle,
          ),
        ],
      ),
    );
  }
}

