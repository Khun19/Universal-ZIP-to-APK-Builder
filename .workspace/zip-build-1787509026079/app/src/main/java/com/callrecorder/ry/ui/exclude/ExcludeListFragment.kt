package com.callrecorder.ry.ui.exclude

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.DialogAddExcludeNumberBinding
import com.callrecorder.ry.databinding.FragmentExcludeListBinding
import com.callrecorder.ry.domain.model.ExcludedNumber
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class ExcludeListFragment : Fragment() {

    private var _binding: FragmentExcludeListBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ExcludeListViewModel by viewModels()
    private lateinit var adapter: ExcludeListAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentExcludeListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeData()
        setupListeners()
    }

    private fun setupRecyclerView() {
        adapter = ExcludeListAdapter(
            onDeleteClick = { item -> confirmDelete(item) }
        )
        binding.rvExcluded.layoutManager = LinearLayoutManager(requireContext())
        binding.rvExcluded.adapter = adapter
    }

    private fun observeData() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.excludedNumbers.collectLatest { list ->
                    adapter.submitList(list)
                    if (list.isEmpty()) {
                        binding.layoutEmptyExclude.visibility = View.VISIBLE
                        binding.rvExcluded.visibility = View.GONE
                    } else {
                        binding.layoutEmptyExclude.visibility = View.GONE
                        binding.rvExcluded.visibility = View.VISIBLE
                    }
                }
            }
        }
    }

    private fun setupListeners() {
        binding.fabAddExcluded.setOnClickListener {
            showAddExcludeDialog()
        }
    }

    private fun showAddExcludeDialog() {
        val dialogBinding = DialogAddExcludeNumberBinding.inflate(layoutInflater)
        MaterialAlertDialogBuilder(requireContext(), R.style.Theme_RyCallRecorder)
            .setTitle(R.string.dialog_add_exclude_title)
            .setView(dialogBinding.root)
            .setPositiveButton(R.string.btn_add) { _, _ ->
                val phone = dialogBinding.etPhoneNumber.text?.toString() ?: ""
                val name = dialogBinding.etContactName.text?.toString()
                if (phone.isNotBlank()) {
                    viewModel.addExcludedNumber(phone, name)
                    Toast.makeText(requireContext(), "Number excluded from recording", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Phone number cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.dialog_cancel_action, null)
            .show()
    }

    private fun confirmDelete(item: ExcludedNumber) {
        MaterialAlertDialogBuilder(requireContext(), R.style.Theme_RyCallRecorder)
            .setTitle(R.string.dialog_delete_exclude_title)
            .setMessage(getString(R.string.dialog_delete_exclude_msg, item.phoneNumber))
            .setPositiveButton(R.string.dialog_delete_action) { _, _ ->
                viewModel.removeExcludedNumber(item.phoneNumber)
            }
            .setNegativeButton(R.string.dialog_cancel_action, null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
