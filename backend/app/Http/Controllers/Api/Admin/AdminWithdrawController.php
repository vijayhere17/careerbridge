<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\User;
use App\Models\WithdrawRequest;
use App\Services\NotificationService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class AdminWithdrawController extends AdminBaseController
{
    public function __construct(
        private WalletService $wallets,
        private NotificationService $notifications,
    ) {
    }

    public function index(Request $request)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $query = WithdrawRequest::with('user:id,name,email,role')->latest();
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = trim((string) $request->query('search', ''))) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate(min(max((int) $request->query('per_page', 12), 1), 50));

        return $this->success([
            'items' => collect($paginator->items())->map(fn (WithdrawRequest $item) => [
                'id' => $item->id,
                'amount' => (float) $item->amount,
                'status' => $item->status,
                'bank_name' => $item->bank_name,
                'account_holder' => $item->account_holder,
                'account_number' => $item->account_number,
                'ifsc' => $item->ifsc,
                'upi' => $item->upi,
                'admin_remarks' => $item->admin_remarks,
                'created_at' => $item->created_at,
                'processed_at' => $item->processed_at,
                'user' => $item->user ? [
                    'id' => $item->user->id,
                    'name' => $item->user->name,
                    'email' => $item->user->email,
                    'role' => $item->user->role,
                ] : null,
            ]),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Withdraw requests retrieved successfully.');
    }

    public function review(Request $request, int $id)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'admin_remarks' => 'nullable|string|max:2000',
        ]);
        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $withdraw = WithdrawRequest::with('user')->find($id);
        if (! $withdraw) {
            return $this->notFound('Withdraw request not found.');
        }
        if ($withdraw->status !== 'pending') {
            return $this->validationError(['status' => ['Only pending requests can be reviewed.']]);
        }

        try {
            DB::transaction(function () use ($request, $withdraw) {
                $status = $request->input('status');
                $withdraw->status = $status;
                $withdraw->admin_remarks = $request->input('admin_remarks');
                $withdraw->processed_at = now();
                $withdraw->save();

                if ($status === 'approved' && $withdraw->user) {
                    $this->wallets->debit(
                        $withdraw->user,
                        (float) $withdraw->amount,
                        'withdraw',
                        'Withdrawal approved',
                        'Request #' . $withdraw->id,
                    );
                }

                if ($withdraw->user) {
                    $this->notifications->notify(
                        $withdraw->user,
                        $status === 'approved' ? 'Withdrawal approved' : 'Withdrawal rejected',
                        $status === 'approved'
                            ? 'Your withdrawal of ₹' . number_format((float) $withdraw->amount, 2) . ' was approved.'
                            : ('Your withdrawal was rejected.' . ($withdraw->admin_remarks ? ' ' . $withdraw->admin_remarks : '')),
                        'withdraw',
                        ['withdraw_request_id' => $withdraw->id, 'status' => $status]
                    );
                }
            });
        } catch (InvalidArgumentException $e) {
            return $this->validationError(['amount' => [$e->getMessage()]]);
        }

        return $this->success([
            'id' => $withdraw->id,
            'status' => $withdraw->status,
            'admin_remarks' => $withdraw->admin_remarks,
            'processed_at' => $withdraw->processed_at,
        ], 'Withdraw request updated successfully.');
    }
}
