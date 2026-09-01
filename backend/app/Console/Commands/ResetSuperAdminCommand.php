<?php

namespace App\Console\Commands;

use App\Support\PlatformSuperAdmin;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ResetSuperAdminCommand extends Command
{
    protected $signature = 'app:reset-superadmin';

    protected $description = 'Interactively reset the platform Superadmin email and password';

    public function handle(): int
    {
        $this->info('Reset platform Superadmin');
        $this->newLine();

        $current = PlatformSuperAdmin::find();

        if ($current !== null) {
            $this->line("Current Superadmin: {$current->email}");
            $this->newLine();
        }

        $email = trim((string) $this->ask('New Superadmin Email', $current?->email ?? PlatformSuperAdmin::email()));
        $password = (string) $this->secret('New Superadmin Password');

        if ($password === '') {
            $this->error('Password cannot be empty.');

            return self::FAILURE;
        }

        try {
            $user = PlatformSuperAdmin::upsert($email, $password, $current?->full_name);
        } catch (ValidationException $exception) {
            foreach ($exception->errors() as $messages) {
                foreach ($messages as $message) {
                    $this->error($message);
                }
            }

            return self::FAILURE;
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        } catch (Throwable $exception) {
            $this->error('Unable to update the Superadmin account.');
            $this->line($exception->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Superadmin updated successfully.');
        $this->line("Email: {$user->email}");
        $this->line('Password: (hidden, stored as a bcrypt hash)');

        return self::SUCCESS;
    }
}
