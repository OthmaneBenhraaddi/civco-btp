<?php

namespace App\Enums;

enum ExpenseCategory: string
{
    case Materials = 'materials';
    case Labor = 'labor';
    case Equipment = 'equipment';
    case Subcontractor = 'subcontractor';
    case Other = 'other';
}
