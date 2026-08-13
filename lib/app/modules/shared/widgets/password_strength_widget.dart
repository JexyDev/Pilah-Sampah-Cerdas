import 'package:flutter/material.dart';
import '../../../core/values/app_colors.dart';

class PasswordStrengthWidget extends StatelessWidget {
  final String password;

  const PasswordStrengthWidget({super.key, required this.password});

  bool get hasMinLength => password.length >= 8;
  bool get hasUppercase => password.contains(RegExp(r'[A-Z]'));
  bool get hasLowercase => password.contains(RegExp(r'[a-z]'));
  bool get hasNumber => password.contains(RegExp(r'[0-9]'));
  bool get hasSpecialChar => password.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'));

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildRequirementRow(
            label: 'Minimal 8 karakter',
            isMet: hasMinLength,
          ),
          const SizedBox(height: 8),
          _buildRequirementRow(
            label: 'Mengandung huruf besar (A-Z)',
            isMet: hasUppercase,
          ),
          const SizedBox(height: 8),
          _buildRequirementRow(
            label: 'Mengandung huruf kecil (a-z)',
            isMet: hasLowercase,
          ),
          const SizedBox(height: 8),
          _buildRequirementRow(
            label: 'Mengandung angka (0-9)',
            isMet: hasNumber,
          ),
          const SizedBox(height: 8),
          _buildRequirementRow(
            label: 'Mengandung karakter khusus (!@#\$...)',
            isMet: hasSpecialChar,
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementRow({required String label, required bool isMet}) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: isMet ? AppColors.primaryGreen : const Color(0xFFCBD5E1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isMet ? Icons.check_rounded : Icons.close_rounded,
            size: 14,
            color: Colors.white,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isMet ? AppColors.primaryGreen : const Color(0xFF94A3B8),
            ),
          ),
        ),
      ],
    );
  }
}
