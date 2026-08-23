package com.callrecorder.ry.ui.exclude

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.callrecorder.ry.databinding.ItemExcludedNumberBinding
import com.callrecorder.ry.domain.model.ExcludedNumber

class ExcludeListAdapter(
    private val onDeleteClick: (ExcludedNumber) -> Unit
) : ListAdapter<ExcludedNumber, ExcludeListAdapter.ExcludedViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ExcludedViewHolder {
        val binding = ItemExcludedNumberBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ExcludedViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ExcludedViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ExcludedViewHolder(
        private val binding: ItemExcludedNumberBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: ExcludedNumber) {
            binding.tvExcludedPhone.text = item.phoneNumber
            if (!item.contactName.isNullOrBlank()) {
                binding.tvExcludedName.text = item.contactName
                binding.tvExcludedName.visibility = View.VISIBLE
            } else {
                binding.tvExcludedName.visibility = View.GONE
            }

            binding.btnDeleteExcluded.setOnClickListener {
                onDeleteClick(item)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<ExcludedNumber>() {
        override fun areItemsTheSame(oldItem: ExcludedNumber, newItem: ExcludedNumber): Boolean =
            oldItem.phoneNumber == newItem.phoneNumber

        override fun areContentsTheSame(oldItem: ExcludedNumber, newItem: ExcludedNumber): Boolean =
            oldItem == newItem
    }
}
